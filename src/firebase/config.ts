import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
  IdTokenResult
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export { firebaseConfig };

// Shared persistence initialization promise to ensure session is preserved across browser closes
export const authPersistencePromise: Promise<void> = setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Persistence set successfully
  })
  .catch((err) => {
    console.warn('Firebase browserLocalPersistence notice:', err);
  });

export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserAuthPermission {
  uid: string;
  email: string;
  role: UserRole;
  studentId?: string;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  defaultDashboardTab: 'admin' | 'dashboard' | 'minhas-notas';
  claims: Record<string, any>;
  profileData?: any;
}

/**
 * Função central de verificação de permissões do Firebase.
 * Analisa tanto as Custom Claims do token JWT quanto o campo 'role' no documento real do Firestore (/users/{uid}).
 * Garante que o redirecionamento e as permissões de acesso ao dashboard sejam baseados na autorização real do Firestore.
 */
export async function verifyUserRoleAndPermissions(user: FirebaseUser): Promise<UserAuthPermission> {
  const emailLower = (user.email || '').toLowerCase().trim();
  const isSuperAdmin = emailLower === 'lucasj6k@gmail.com';

  // 1. Obter Custom Claims do token de autenticação
  let claims: Record<string, any> = {};
  try {
    const idTokenResult: IdTokenResult = await user.getIdTokenResult();
    claims = idTokenResult.claims || {};
  } catch (err) {
    console.warn('Erro ao obter Custom Claims:', err);
  }

  // 2. Consultar o campo 'role' diretamente no documento Firestore do usuário (/users/{uid})
  let firestoreRole: string | null = null;
  let profileDoc: any = null;

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      profileDoc = userSnap.data();
      firestoreRole = profileDoc.role;
    }
  } catch (err) {
    console.warn('Erro ao consultar documento de usuário no Firestore:', err);
  }

  // 3. Determinar o papel real com base na permissão do Firestore e Custom Claims:
  // - lucasj6k@gmail.com é incondicionalmente Administrador Principal
  // - Custom claim de admin/role
  // - Campo 'role' do documento do Firestore
  let determinedRole: UserRole = 'student';

  if (isSuperAdmin) {
    determinedRole = 'admin';
  } else if (claims.role === 'admin' || claims.admin === true) {
    determinedRole = 'admin';
  } else if (
    claims.role === 'teacher' ||
    firestoreRole === 'teacher' ||
    firestoreRole === 'coordenador'
  ) {
    determinedRole = 'teacher';
  } else if (firestoreRole === 'admin' && isSuperAdmin) {
    determinedRole = 'admin';
  } else {
    // Alunos ou contas não categorizadas recebem 'student'
    determinedRole = 'student';
  }

  // 4. Se for o administrador principal e o documento ainda não refletir isso, atualiza no Firestore
  if (isSuperAdmin && (!profileDoc || profileDoc.role !== 'admin')) {
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          id: user.uid,
          name: user.displayName || 'Lucas (Administrador)',
          email: emailLower,
          role: 'admin',
          active: true,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Nota de sincronização de perfil admin:', e);
    }
  }

  // 5. Determinar o redirecionamento para o dashboard correto com base na permissão real
  let defaultDashboardTab: 'admin' | 'dashboard' | 'minhas-notas' = 'dashboard';
  if (determinedRole === 'admin') {
    defaultDashboardTab = 'admin';
  } else if (determinedRole === 'teacher') {
    defaultDashboardTab = 'dashboard';
  } else {
    defaultDashboardTab = 'minhas-notas';
  }

  return {
    uid: user.uid,
    email: emailLower,
    role: determinedRole,
    studentId: profileDoc?.studentId,
    isAdmin: determinedRole === 'admin',
    isTeacher: determinedRole === 'teacher' || determinedRole === 'admin',
    isStudent: determinedRole === 'student',
    defaultDashboardTab,
    claims,
    profileData: profileDoc
  };
}
