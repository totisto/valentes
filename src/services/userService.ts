import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../firebase/config';
import firebaseConfig from '../../firebase-applet-config.json';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { UserProfile, Role } from '../types';
import { INITIAL_TEACHERS } from '../data/initialData';

const COLLECTION_NAME = 'users';

export async function seedInitialTeachersIfEmpty(): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const users: UserProfile[] = [];
      snap.forEach((d) => users.push({ ...(d.data() as UserProfile), id: d.id }));
      // Ensure lucasj6k@gmail.com is present with admin role
      const hasLucas = users.some((u) => u.email.toLowerCase() === 'lucasj6k@gmail.com');
      if (!hasLucas) {
        const lucasProfile: UserProfile = {
          id: 'admin-lucas',
          name: 'Lucas (Administrador)',
          email: 'lucasj6k@gmail.com',
          role: 'admin',
          active: true,
          avatarSeed: 'lucas',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: 'Admin Autorizado'
        };
        await setDoc(doc(db, COLLECTION_NAME, 'admin-lucas'), lucasProfile, { merge: true });
        users.unshift(lucasProfile);
      }
      return users;
    }

    // Seed initial teachers
    const seeded: UserProfile[] = [];
    for (const teacher of INITIAL_TEACHERS) {
      const docRef = doc(db, COLLECTION_NAME, teacher.id);
      await setDoc(docRef, teacher);
      seeded.push(teacher);
    }
    return seeded;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    return INITIAL_TEACHERS;
  }
}

export function subscribeUsers(callback: (users: UserProfile[]) => void): () => void {
  const colRef = collection(db, COLLECTION_NAME);

  return onSnapshot(
    colRef,
    (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as UserProfile), id: d.id }));
      callback(list);
    },
    (err) => {
      console.warn('Users listener notice:', err);
    }
  );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, uid));
    if (docSnap.exists()) {
      return { ...(docSnap.data() as UserProfile), id: docSnap.id };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${uid}`);
    return null;
  }
}

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  try {
    await setDoc(
      doc(db, COLLECTION_NAME, profile.id),
      {
        ...profile,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTION_NAME}/${profile.id}`);
  }
}

/**
 * Creates a new teacher record by the Administrator.
 * Uses a secondary Firebase App instance so the current administrator's auth session
 * is completely preserved.
 * NEVER creates fake IDs like prof-xxx: requires real Firebase Auth account.
 */
export async function createTeacherUser(data: {
  name: string;
  email: string;
  initialPassword?: string;
}): Promise<UserProfile> {
  const emailClean = data.email.trim().toLowerCase();
  const nameClean = data.name.trim();

  if (!emailClean) {
    throw new Error('E-mail do professor é obrigatório.');
  }

  if (!data.initialPassword || data.initialPassword.length < 6) {
    throw new Error('A senha inicial para o professor deve ter pelo menos 6 caracteres.');
  }

  let authUid: string;
  const secondaryName = `SecondaryAdminApp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      emailClean,
      data.initialPassword
    );
    authUid = userCredential.user.uid;
    await signOut(secondaryAuth);
  } catch (authErr: any) {
    if (authErr?.code === 'auth/email-already-in-use') {
      const usersCol = collection(db, COLLECTION_NAME);
      const snap = await getDocs(usersCol);
      let existingProfile: UserProfile | null = null;
      snap.forEach((d) => {
        const p = d.data() as UserProfile;
        if (p.email?.toLowerCase() === emailClean) {
          existingProfile = { ...p, id: d.id };
        }
      });

      if (existingProfile) {
        throw new Error(
          `O e-mail "${emailClean}" já possui cadastro no sistema como ${(existingProfile as any).role || 'usuário'}. Atualize as permissões na lista de usuários.`
        );
      } else {
        throw new Error(
          `O e-mail "${emailClean}" já existe no Firebase Authentication. Não é possível criar uma conta duplicada.`
        );
      }
    }
    throw new Error(
      authErr?.message || 'Falha ao registrar conta de autenticação para o professor.'
    );
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch {}
  }

  const newProfile: UserProfile = {
    id: authUid,
    name: nameClean,
    email: emailClean,
    role: 'teacher',
    active: true,
    avatarSeed: emailClean,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: 'Pendente primeiro acesso'
  };

  await setDoc(doc(db, COLLECTION_NAME, authUid), newProfile, { merge: true });
  return newProfile;
}

/**
 * Links an authenticated user UID to a canonical student ID (/users/{uid}.studentId = canonicalStudentId)
 */
export async function linkStudentToUser(uid: string, studentId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, uid), {
      studentId: studentId.trim(),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${uid}`);
  }
}

export async function updateTeacherProfile(
  userId: string,
  data: { name?: string; email?: string; role?: Role; active?: boolean }
): Promise<void> {
  try {
    const payload: Partial<UserProfile> = {
      updatedAt: new Date().toISOString()
    };
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase();
    if (data.role !== undefined) payload.role = data.role;
    if (data.active !== undefined) payload.active = data.active;

    await updateDoc(doc(db, COLLECTION_NAME, userId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${userId}`);
  }
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, userId), {
      role,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${userId}`);
  }
}

export async function toggleUserActive(userId: string, active: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, userId), {
      active,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${userId}`);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${userId}`);
  }
}
