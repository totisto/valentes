import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Category } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';

const COLLECTION_NAME = 'categories';

export async function seedInitialCategoriesIfEmpty(): Promise<Category[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const categories: Category[] = [];
      snap.forEach((d) => categories.push({ ...(d.data() as Category), id: d.id }));
      return categories;
    }

    // Seed initial categories
    const seeded: Category[] = [];
    for (const cat of INITIAL_CATEGORIES) {
      const docRef = doc(db, COLLECTION_NAME, cat.id);
      await setDoc(docRef, cat);
      seeded.push(cat);
    }
    return seeded;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    return INITIAL_CATEGORIES;
  }
}

export function subscribeCategories(callback: (categories: Category[]) => void): () => void {
  const colRef = collection(db, COLLECTION_NAME);

  return onSnapshot(
    colRef,
    (snap) => {
      const list: Category[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as Category), id: d.id }));
      callback(list);
    },
    (err) => {
      console.warn('Categories listener notice:', err);
    }
  );
}

export async function addCategory(data: { name: string; description?: string; defaultPoints?: number; iconName?: string }): Promise<Category> {
  const cleanName = data.name.trim();
  const id = `cat-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}`;
  const now = new Date().toISOString();
  const category: Category = {
    id,
    name: cleanName,
    description: data.description?.trim() || '',
    active: true,
    defaultPoints: data.defaultPoints || 10,
    iconName: data.iconName || 'Award',
    createdAt: now
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), category);
    return category;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    return category;
  }
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
}
