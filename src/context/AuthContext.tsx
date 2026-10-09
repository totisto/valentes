import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import {
  auth,
  db,
  authPersistencePromise,
  verifyUserRoleAndPermissions,
  UserAuthPermission
} from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { getUserProfile, upsertUserProfile, linkStudentToUser } from '../services/userService';
import {
  findMatchForAccount,
  linkStudentAuthUid
} from '../services/studentService';
import { UserProfile, Role } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: Role | 'student' | null;
  studentId: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isLoading: boolean;
  authError: string | null;
  defaultDashboardTab: 'admin' | 'dashboard' | 'minhas-notas';
  verifyPermissionsNow: () => Promise<UserAuthPermission | null>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  registerStudentAccount: (name: string, email: string, pass: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  linkStudentAccount: (targetUid: string, canonicalStudentId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  // Do NOT initialize from localStorage to prevent spoofing or stale cross-account access
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [defaultDashboardTab, setDefaultDashboardTab] = useState<'admin' | 'dashboard' | 'minhas-notas'>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Runtime permissions check
  const verifyPermissionsNow = async (): Promise<UserAuthPermission | null> => {
    if (!currentUser) return null;
    try {
      const permissions = await verifyUserRoleAndPermissions(currentUser);
      setDefaultDashboardTab(permissions.defaultDashboardTab);
      return permissions;
    } catch (err) {
      console.warn('Erro ao verificar permissões:', err);
      return null;
    }
  };

  // Firebase Auth listener with guaranteed persistence resolution and canonical student linkage
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // Ensure browserLocalPersistence is ready before observing state
      try {
        await authPersistencePromise;
      } catch (err) {
        console.warn('Persistence setup warning:', err);
      }

      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (!isMounted) return;

        if (fbUser) {
          try {
            // 1. Verify claims and role in Firestore
            const permissions = await verifyUserRoleAndPermissions(fbUser);
            if (isMounted) {
              setDefaultDashboardTab(permissions.defaultDashboardTab);
            }

            // 2. Fetch user profile from Firestore /users/{uid}
            let profile = await getUserProfile(fbUser.uid);

            if (profile) {
              // Ensure role matches verified permissions
              if (profile.role !== permissions.role) {
                profile.role = permissions.role as any;
                await upsertUserProfile(profile);
              }

              // 3. For students, resolve canonical studentId link if not already set
              if (profile.role === 'student' && !profile.studentId) {
                const matchedStudent = await findMatchForAccount(
                  fbUser.email || profile.email,
                  profile.name
                );

                if (matchedStudent) {
                  profile.studentId = matchedStudent.id;
                  await upsertUserProfile(profile);
                  await linkStudentAuthUid(matchedStudent.id, fbUser.uid);
                }
              }

              if (isMounted) {
                setUserProfile(profile);
                setCurrentUser(fbUser);
              }
            } else {
              // Create initial profile in Firestore
              let canonicalStudentId: string | undefined = undefined;

              if (permissions.role === 'student') {
                const matchedStudent = await findMatchForAccount(
                  fbUser.email || '',
                  fbUser.displayName || ''
                );

                if (matchedStudent) {
                  canonicalStudentId = matchedStudent.id;
                  await linkStudentAuthUid(matchedStudent.id, fbUser.uid);
                } else {
                  // Create new official student record for this new user
                  const newStudentDocId = fbUser.uid;
                  await setDoc(
                    doc(db, 'students', newStudentDocId),
                    {
                      id: newStudentDocId,
                      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Aluno',
                      email: fbUser.email?.toLowerCase() || '',
                      authUid: fbUser.uid,
                      active: true,
                      avatarSeed: (fbUser.displayName || 'aluno').toLowerCase(),
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    },
                    { merge: true }
                  );
                  canonicalStudentId = newStudentDocId;
                }
              }

              const newProfile: UserProfile = {
                id: fbUser.uid,
                name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário',
                email: fbUser.email?.toLowerCase() || '',
                role: permissions.role as any,
                studentId: canonicalStudentId,
                active: true,
                avatarSeed: (fbUser.displayName || fbUser.email || 'user').toLowerCase(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLogin: new Date().toLocaleString('pt-BR')
              };

              await upsertUserProfile(newProfile);
              if (isMounted) {
                setUserProfile(newProfile);
                setCurrentUser(fbUser);
              }
            }
          } catch (e) {
            console.warn('Erro na resolução do perfil autenticado:', e);
            if (isMounted) {
              setCurrentUser(fbUser);
            }
          }
        } else {
          if (isMounted) {
            setCurrentUser(null);
            setUserProfile(null);
            setDefaultDashboardTab('dashboard');
          }
        }

        if (isMounted) {
          setIsLoading(false);
        }
      });

      return unsubscribe;
    };

    let unsubFn: (() => void) | undefined;
    initAuth().then((unsub) => {
      unsubFn = unsub;
    });

    return () => {
      isMounted = false;
      if (unsubFn) unsubFn();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    try {
      await authPersistencePromise;
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (userCred.user) {
        const perms = await verifyUserRoleAndPermissions(userCred.user);
        setDefaultDashboardTab(perms.defaultDashboardTab);
      }
      return true;
    } catch (err: any) {
      const msg =
        err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential'
          ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
          : err.code === 'auth/wrong-password'
          ? 'Senha incorreta.'
          : err.code === 'auth/too-many-requests'
          ? 'Muitas tentativas sem sucesso. Aguarde alguns instantes.'
          : err.message || 'Erro ao realizar login.';
      setAuthError(msg);
      return false;
    }
  };

  /**
   * Public Student Registration:
   * Sets role strictly to 'student' and establishes unique link to canonical studentId.
   * NEVER saves plain passwords in Firestore.
   */
  const registerStudentAccount = async (
    name: string,
    email: string,
    pass: string
  ): Promise<boolean> => {
    setAuthError(null);
    try {
      await authPersistencePromise;
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCred.user;

      await updateProfile(user, { displayName: name.trim() });

      // 1. Resolve canonical student: check unambiguous match in existing students
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      const matched = await findMatchForAccount(cleanEmail, cleanName);

      let canonicalStudentId: string;
      if (matched) {
        canonicalStudentId = matched.id;
        await linkStudentAuthUid(matched.id, user.uid);
      } else {
        // Create official canonical student document
        canonicalStudentId = user.uid;
        await setDoc(
          doc(db, 'students', canonicalStudentId),
          {
            id: canonicalStudentId,
            name: cleanName,
            email: cleanEmail,
            authUid: user.uid,
            active: true,
            avatarSeed: cleanName.toLowerCase(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }

      // 2. Save user profile in /users/{uid} with studentId reference (NO passwords saved)
      const studentProfile: UserProfile = {
        id: user.uid,
        name: cleanName,
        email: cleanEmail,
        role: 'student',
        studentId: canonicalStudentId,
        active: true,
        avatarSeed: cleanName.toLowerCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toLocaleString('pt-BR')
      };

      await upsertUserProfile(studentProfile);
      setUserProfile(studentProfile);
      setCurrentUser(user);
      setDefaultDashboardTab('minhas-notas');
      return true;
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.'
          : err.code === 'auth/weak-password'
          ? 'A senha deve ter pelo menos 6 caracteres.'
          : err.message || 'Erro ao criar conta de aluno.';
      setAuthError(msg);
      return false;
    }
  };

  /**
   * Google Sign-In: uses only basic authentication scopes (email/profile).
   * Separated strictly from external Gmail permissions per requirement 10.
   */
  const loginWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      await authPersistencePromise;
      const provider = new GoogleAuthProvider();
      // Only default basic auth scopes, NO Gmail scopes
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        const perms = await verifyUserRoleAndPermissions(result.user);
        setDefaultDashboardTab(perms.defaultDashboardTab);
      }
      return true;
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao autenticar com o Google.');
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao enviar e-mail de recuperação.');
      return false;
    }
  };

  const logout = async () => {
    setUserProfile(null);
    setCurrentUser(null);
    setDefaultDashboardTab('dashboard');
    try {
      await signOut(auth);
    } catch {}
  };

  /**
   * Admin tool: links any student account to a canonical student ID
   */
  const linkStudentAccount = async (targetUid: string, canonicalStudentId: string) => {
    await linkStudentToUser(targetUid, canonicalStudentId);
    await linkStudentAuthUid(canonicalStudentId, targetUid);
    if (currentUser?.uid === targetUid && userProfile) {
      setUserProfile({ ...userProfile, studentId: canonicalStudentId });
    }
  };

  const isLucasAdmin =
    currentUser?.email?.toLowerCase() === 'lucasj6k@gmail.com' ||
    userProfile?.email?.toLowerCase() === 'lucasj6k@gmail.com';

  const role: Role | 'student' | null = isLucasAdmin
    ? 'admin'
    : (userProfile?.role as any) || (currentUser ? 'student' : null);

  const isAdmin = isLucasAdmin || userProfile?.role === 'admin';
  const isTeacher =
    (userProfile?.role === 'teacher' || (!isAdmin && role === 'teacher')) && userProfile?.role !== 'student';
  const isStudent = role === 'student';
  const studentId = userProfile?.studentId || (isStudent ? currentUser?.uid || null : null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        studentId,
        isAdmin,
        isTeacher,
        isStudent,
        isLoading,
        authError,
        defaultDashboardTab,
        verifyPermissionsNow,
        loginWithEmail,
        loginWithGoogle,
        registerStudentAccount,
        resetPassword,
        logout,
        clearAuthError: () => setAuthError(null),
        linkStudentAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
