import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import {
  auth,
  db,
  authPersistencePromise,
  verifyUserRoleAndPermissions,
  UserAuthPermission,
  activePersistenceType,
  persistenceWarning
} from '../firebase/config';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
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
  isPendingStudentLink: boolean;
  isLoading: boolean;
  authError: string | null;
  defaultDashboardTab: 'admin' | 'dashboard' | 'minhas-notas';
  verifyPermissionsNow: () => Promise<UserAuthPermission | null>;
  refreshUserProfile: () => Promise<UserProfile | null>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  registerStudentAccount: (name: string, email: string, pass: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  linkStudentAccount: (targetUid: string, canonicalStudentId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to detect iOS / Safari / mobile devices where popups fail or are blocked
const isMobileOrIOS = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isIOS || isMobile;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [defaultDashboardTab, setDefaultDashboardTab] = useState<'admin' | 'dashboard' | 'minhas-notas'>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Counter and Ref to prevent async race condition when identity changes (Point 4)
  const currentAuthUidRef = useRef<string | null>(null);
  const authReqCounterRef = useRef<number>(0);

  // Handle redirect result for iPhone / Safari / mobile browser on startup
  useEffect(() => {
    let isMounted = true;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!isMounted || !result?.user) return;
        try {
          const perms = await verifyUserRoleAndPermissions(result.user);
          if (isMounted) {
            setDefaultDashboardTab(perms.defaultDashboardTab);
          }
        } catch (err) {
          console.warn('Redirect permissions check note:', err);
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        if (err.code !== 'auth/popup-closed-by-user') {
          console.warn('getRedirectResult notice:', err);
          if (err.code === 'auth/unauthorized-domain') {
            setAuthError('Domínio não autorizado no Firebase Console. Adicione este domínio aos Domínios Autorizados no Firebase Authentication.');
          } else {
            setAuthError(err.message || 'Erro ao processar retorno da autenticação.');
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Main Auth state observer with race-condition protection (Point 4)
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        await authPersistencePromise;
      } catch (err) {
        console.warn('Persistence promise note:', err);
      }

      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (!isMounted) return;

        const reqId = ++authReqCounterRef.current;

        // 1. Clear previous profile immediately from memory
        setUserProfile(null);

        if (!fbUser) {
          currentAuthUidRef.current = null;
          setCurrentUser(null);
          setDefaultDashboardTab('dashboard');
          setIsLoading(false);
          return;
        }

        // Set current UID tracking
        currentAuthUidRef.current = fbUser.uid;
        setCurrentUser(fbUser);

        try {
          // 2 & 3. Verify permissions and consult user profile by current UID
          const permissions = await verifyUserRoleAndPermissions(fbUser);

          // Discard if another auth change was triggered in the meantime
          if (reqId !== authReqCounterRef.current || currentAuthUidRef.current !== fbUser.uid) {
            return;
          }

          if (isMounted) {
            setDefaultDashboardTab(permissions.defaultDashboardTab);
          }

          let profile = await getUserProfile(fbUser.uid);

          // Discard if identity changed while awaiting getUserProfile
          if (reqId !== authReqCounterRef.current || currentAuthUidRef.current !== fbUser.uid) {
            return;
          }

          if (profile) {
            // Synchronize role if claims or permissions differ
            if (profile.role !== permissions.role) {
              profile.role = permissions.role as any;
              await upsertUserProfile(profile);
            }

            // Check if student has exact verified email match with unlinked student
            if (profile.role === 'student' && !profile.studentId && fbUser.email) {
              const matchedStudent = await findMatchForAccount(fbUser.email, fbUser.uid);
              if (matchedStudent) {
                // If unambiguous match by verified email, save link
                profile.studentId = matchedStudent.id;
                await upsertUserProfile(profile);
              }
            }
          } else {
            // Initial profile creation in Firestore
            let matchedStudentId: string | undefined = undefined;

            if (permissions.role === 'student' && fbUser.email) {
              const matched = await findMatchForAccount(fbUser.email, fbUser.uid);
              if (matched) {
                matchedStudentId = matched.id;
              }
            }

            const isLucasAdmin = fbUser.email?.toLowerCase().trim() === 'lucasj6k@gmail.com';
            const newProfile: UserProfile = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário',
              email: (fbUser.email || '').toLowerCase().trim(),
              role: isLucasAdmin ? 'admin' : (permissions.role as any) || 'student',
              studentId: matchedStudentId,
              active: true,
              avatarSeed: (fbUser.displayName || fbUser.email || 'user').toLowerCase(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLogin: new Date().toLocaleString('pt-BR')
            };

            await upsertUserProfile(newProfile);
            profile = newProfile;
          }

          // 5. Final confirmation that the result STILL belongs to current authenticated UID
          if (reqId !== authReqCounterRef.current || currentAuthUidRef.current !== fbUser.uid) {
            return;
          }

          // 6. Only now publish the new profile to application state
          if (isMounted) {
            setUserProfile(profile);
            setIsLoading(false);
          }
        } catch (e: any) {
          console.warn('Erro na resolução do perfil autenticado:', e);
          if (reqId === authReqCounterRef.current && isMounted) {
            // Keep currentUser so we don't kick back to login without information
            setCurrentUser(fbUser);
            setIsLoading(false);
          }
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

  // Allows manual re-check of profile (e.g. from StudentPendingLinkView)
  const refreshUserProfile = async (): Promise<UserProfile | null> => {
    if (!currentUser) return null;
    try {
      const p = await getUserProfile(currentUser.uid);
      if (p && currentAuthUidRef.current === currentUser.uid) {
        setUserProfile(p);
      }
      return p;
    } catch {
      return null;
    }
  };

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
   * Google Sign-In with iPhone / Safari redirect strategy (Point 5):
   * - Uses basic authentication scopes only (no Gmail scopes)
   * - Uses redirect on iOS Safari / mobile where popups fail
   */
  const loginWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      await authPersistencePromise;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const isMobileDevice = isMobileOrIOS();
      const isTopWindow = typeof window !== 'undefined' && window.self === window.top;

      // On mobile / Safari top-level, prefer redirect to guarantee compatibility
      if (isMobileDevice && isTopWindow) {
        await signInWithRedirect(auth, provider);
        return true;
      }

      // In desktop or iframe environments, attempt popup
      try {
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
          const perms = await verifyUserRoleAndPermissions(result.user);
          setDefaultDashboardTab(perms.defaultDashboardTab);
        }
        return true;
      } catch (popupErr: any) {
        if (
          (popupErr.code === 'auth/popup-blocked' ||
           popupErr.code === 'auth/popup-closed-by-user' ||
           popupErr.code === 'auth/cancelled-popup-request') &&
          isTopWindow
        ) {
          console.info('Popup bloqueado, utilizando signInWithRedirect para Safari/iPhone.');
          await signInWithRedirect(auth, provider);
          return true;
        }
        throw popupErr;
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        const msg =
          err.code === 'auth/unauthorized-domain'
            ? 'Domínio não autorizado no Firebase Console. Adicione este domínio em Autenticação > Configurações > Domínios Autorizados.'
            : err.message || 'Erro ao autenticar com o Google.';
        setAuthError(msg);
      }
      return false;
    }
  };

  /**
   * Public Student Registration:
   * Sets role strictly to 'student'. Does NOT set arbitrary studentId.
   * If exact matching email is verified in students list, connects safely;
   * otherwise leaves studentId undefined (pending admin verification).
   */
  const registerStudentAccount = async (
    name: string,
    email: string,
    pass: string
  ): Promise<boolean> => {
    setAuthError(null);
    try {
      await authPersistencePromise;
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const user = userCred.user;

      await updateProfile(user, { displayName: cleanName });

      // Check if there is an exact verified email match
      const matched = await findMatchForAccount(cleanEmail, user.uid);
      const canonicalStudentId = matched ? matched.id : undefined;

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
    authReqCounterRef.current++;
    currentAuthUidRef.current = null;
    setUserProfile(null);
    setCurrentUser(null);
    setDefaultDashboardTab('dashboard');
    try {
      await signOut(auth);
    } catch {}
  };

  /**
   * Admin tool: links a student account to a canonical student ID (Point 2 & 3).
   * Validates duplicate links, ensures authorized operation by lucasj6k@gmail.com.
   */
  const linkStudentAccount = async (targetUid: string, canonicalStudentId: string) => {
    const isLucas =
      currentUser?.email?.toLowerCase() === 'lucasj6k@gmail.com' ||
      userProfile?.email?.toLowerCase() === 'lucasj6k@gmail.com' ||
      userProfile?.role === 'admin';

    if (!isLucas) {
      throw new Error('Apenas o Administrador Principal autorizado pode vincular contas de alunos.');
    }

    const cleanUid = targetUid.trim();
    const cleanStdId = canonicalStudentId.trim();

    if (!cleanUid || !cleanStdId) {
      throw new Error('UID e ID canônico do aluno são obrigatórios.');
    }

    // Check for duplicate linkage in users collection
    const usersSnap = await getDocs(collection(db, 'users'));
    let alreadyLinkedTo: UserProfile | null = null;
    usersSnap.forEach((d) => {
      const u = d.data() as UserProfile;
      if (d.id !== cleanUid && u.studentId === cleanStdId) {
        alreadyLinkedTo = { ...u, id: d.id };
      }
    });

    if (alreadyLinkedTo) {
      throw new Error(
        `O aluno "${cleanStdId}" já está vinculado à conta de ${(alreadyLinkedTo as any).email || (alreadyLinkedTo as any).name}. Desfaça o vínculo anterior para evitar duplicidade.`
      );
    }

    // Perform authorized updates
    await linkStudentToUser(cleanUid, cleanStdId);
    await linkStudentAuthUid(cleanStdId, cleanUid);

    if (currentUser?.uid === cleanUid && userProfile) {
      setUserProfile({ ...userProfile, studentId: cleanStdId });
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
  const studentId = userProfile?.studentId || null;
  const isPendingStudentLink = isStudent && !studentId;

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
        isPendingStudentLink,
        isLoading,
        authError,
        defaultDashboardTab,
        verifyPermissionsNow,
        refreshUserProfile,
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
