import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Student } from '../types';
import { INITIAL_STUDENTS } from '../data/initialData';

const COLLECTION_NAME = 'students';

export async function seedInitialStudentsIfEmpty(): Promise<Student[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const students: Student[] = [];
      snap.forEach((d) => students.push({ ...(d.data() as Student), id: d.id }));
      return students.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Seed 21 students
    const seeded: Student[] = [];
    for (const student of INITIAL_STUDENTS) {
      const docRef = doc(db, COLLECTION_NAME, student.id);
      await setDoc(docRef, {
        id: student.id,
        name: student.name,
        active: true,
        avatarSeed: student.avatarSeed || student.name.toLowerCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      seeded.push(student);
    }
    return seeded.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    return INITIAL_STUDENTS;
  }
}

export function subscribeStudents(callback: (students: Student[]) => void): () => void {
  const colRef = collection(db, COLLECTION_NAME);
  const q = query(colRef, orderBy('name'));

  return onSnapshot(
    q,
    (snap) => {
      const list: Student[] = [];
      snap.forEach((d) => {
        const data = d.data() as Student;
        // Exclude duplicate or inactive students for active ranking and launch views
        if (data.active !== false) {
          list.push({ ...data, id: d.id });
        }
      });
      callback(list);
    },
    (err) => {
      console.warn('Students listener error (handled gracefully):', err);
    }
  );
}

/**
 * Subscribes to all students including inactive records for administrative audit and manual linking
 */
export function subscribeAllStudents(callback: (students: Student[]) => void): () => void {
  const colRef = collection(db, COLLECTION_NAME);
  const q = query(colRef, orderBy('name'));

  return onSnapshot(
    q,
    (snap) => {
      const list: Student[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as Student), id: d.id }));
      callback(list);
    },
    (err) => {
      console.warn('All students listener error:', err);
    }
  );
}

/**
 * Finds an official student record linked to an Auth UID
 */
export async function findStudentByAuthUid(authUid: string): Promise<Student | null> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    let matched: Student | null = null;
    snap.forEach((d) => {
      const data = d.data() as Student;
      if (data.authUid === authUid || d.id === authUid) {
        matched = { ...data, id: d.id };
      }
    });
    return matched;
  } catch (err) {
    console.warn('Find student by authUid notice:', err);
    return null;
  }
}

/**
 * Resolves an unambiguous student match for an authenticated user:
 * 1. Checks if student has exact matching verified email
 * 2. Ensures student is active and not already linked to another different authUid
 * 3. Never auto-associates by name (ambiguous matches require admin linking)
 */
export async function findMatchForAccount(email: string, currentAuthUid?: string): Promise<Student | null> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;

    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    const allStudents: Student[] = [];
    snap.forEach((d) => allStudents.push({ ...(d.data() as Student), id: d.id }));

    // Exact email match (unambiguous, active, and not stolen from someone else)
    const emailMatches = allStudents.filter(
      (s) =>
        s.email &&
        s.email.trim().toLowerCase() === cleanEmail &&
        s.active !== false &&
        (!s.authUid || s.authUid === currentAuthUid)
    );

    if (emailMatches.length === 1) {
      return emailMatches[0];
    }

    return null;
  } catch (err) {
    console.warn('Find match for account notice:', err);
    return null;
  }
}

/**
 * Links an official student record to a Firebase Auth UID
 */
export async function linkStudentAuthUid(studentId: string, authUid: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, studentId), {
      authUid,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${studentId}`);
  }
}

export async function addStudent(name: string): Promise<Student> {
  const cleanName = name.trim();
  const id = `std-${Date.now()}`;
  const now = new Date().toISOString();
  const student: Student = {
    id,
    name: cleanName,
    active: true,
    avatarSeed: cleanName.toLowerCase(),
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), student);
    return student;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    return student;
  }
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
}

export async function deleteStudent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
}
