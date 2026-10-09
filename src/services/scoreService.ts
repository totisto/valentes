import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { ScoreEntry, Student, UserProfile } from '../types';
import { generateSeedEntries } from '../data/initialData';
import { getISOWeekInfo, generateEntryId } from '../utils/dateUtils';

const COLLECTION_NAME = 'scoreEntries';

/**
 * Removes any undefined properties so Firestore WriteBatch/setDoc/updateDoc never errors out
 */
function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        cleaned[key] = cleanForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Desativado conforme requisito: não gera pontuações artificiais em produção.
 * Se não houver pontuações no Firestore, os alunos cadastrados são exibidos com 0 pontos.
 * Preserva integralmente todas as pontuações e históricos reais existentes.
 */
export async function seedInitialScoresIfEmpty(_students: Student[], _teachers: UserProfile[]): Promise<ScoreEntry[]> {
  // Artificial score generation disabled. Returns empty array without writing mock data.
  return [];
}

export function subscribeScoreEntries(callback: (entries: ScoreEntry[]) => void): () => void {
  const colRef = collection(db, COLLECTION_NAME);

  return onSnapshot(
    colRef,
    (snap) => {
      const list: ScoreEntry[] = [];
      snap.forEach((d) => {
        const raw = d.data() as any;
        const pts = raw.points !== undefined ? Number(raw.points) : Number(raw.total) || 0;
        list.push({
          ...raw,
          id: d.id,
          points: pts,
          total: pts,
          notes: raw.notes || '',
          pontualidade: raw.pontualidade ?? 10,
          comportamento: raw.comportamento ?? 10,
          presenca: raw.presenca ?? 10,
          participacao: raw.participacao ?? 10,
          atividade: raw.atividade ?? 10
        });
      });

      // Sort descending by date, then by createdAt
      list.sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });

      callback(list);
    },
    (err) => {
      console.warn('Realtime score listener note:', err);
    }
  );
}

export async function fetchAllScoreEntriesOnce(): Promise<ScoreEntry[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    const list: ScoreEntry[] = [];
    snap.forEach((d) => {
      const raw = d.data() as any;
      const pts = raw.points !== undefined ? Number(raw.points) : Number(raw.total) || 0;
      list.push({
        ...raw,
        id: d.id,
        points: pts,
        total: pts,
        notes: raw.notes || '',
        pontualidade: raw.pontualidade ?? 10,
        comportamento: raw.comportamento ?? 10,
        presenca: raw.presenca ?? 10,
        participacao: raw.participacao ?? 10,
        atividade: raw.atividade ?? 10
      });
    });
    list.sort((a, b) => {
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    return list;
  } catch (err) {
    console.warn('Fetch scores note:', err);
    return [];
  }
}

export async function createScoreEntry(data: {
  studentId: string;
  studentName: string;
  points: number;
  categoryId?: string;
  categoryName?: string;
  teacherId: string;
  teacherName: string;
  date: string;
  notes?: string;
  pontualidade?: number;
  comportamento?: number;
  presenca?: number;
  participacao?: number;
  atividade?: number;
}): Promise<ScoreEntry> {
  const dateObj = new Date(data.date + 'T12:00:00');
  const weekInfo = getISOWeekInfo(dateObj);
  const nowIso = new Date().toISOString();
  const id = generateEntryId();
  const points = Math.round(Number(data.points) || 0);

  const entry: ScoreEntry = {
    id,
    studentId: data.studentId,
    studentName: data.studentName,
    points,
    total: points,
    categoryId: data.categoryId || 'cat-presenca',
    categoryName: data.categoryName || 'Presença',
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    date: data.date,
    week: weekInfo.weekLabel,
    weekNumber: weekInfo.weekNumber,
    month: weekInfo.monthKey,
    monthLabel: weekInfo.monthLabel,
    year: weekInfo.year,
    notes: (data.notes || '').trim(),
    pontualidade: data.pontualidade ?? 10,
    comportamento: data.comportamento ?? 10,
    presenca: data.presenca ?? 10,
    participacao: data.participacao ?? 10,
    atividade: data.atividade ?? 10,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), cleanForFirestore(entry));
    return entry;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    return entry;
  }
}

export async function createBatchScoreEntries(
  items: {
    studentId: string;
    studentName: string;
    points: number;
    categoryId?: string;
    categoryName?: string;
    teacherId: string;
    teacherName: string;
    date: string;
    notes?: string;
  }[]
): Promise<ScoreEntry[]> {
  if (items.length === 0) return [];

  const createdEntries: ScoreEntry[] = [];
  const batch = writeBatch(db);
  const nowIso = new Date().toISOString();

  for (const item of items) {
    const dateObj = new Date(item.date + 'T12:00:00');
    const weekInfo = getISOWeekInfo(dateObj);
    const id = generateEntryId();
    const pts = Math.round(Number(item.points) || 0);

    const entry: ScoreEntry = {
      id,
      studentId: item.studentId,
      studentName: item.studentName,
      points: pts,
      total: pts,
      categoryId: item.categoryId || 'cat-presenca',
      categoryName: item.categoryName || 'Presença',
      teacherId: item.teacherId,
      teacherName: item.teacherName,
      date: item.date,
      week: weekInfo.weekLabel,
      weekNumber: weekInfo.weekNumber,
      month: weekInfo.monthKey,
      monthLabel: weekInfo.monthLabel,
      year: weekInfo.year,
      notes: (item.notes || '').trim(),
      pontualidade: 10,
      comportamento: 10,
      presenca: 10,
      participacao: 10,
      atividade: 10,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    batch.set(doc(db, COLLECTION_NAME, id), cleanForFirestore(entry));
    createdEntries.push(entry);
  }

  try {
    await batch.commit();
    return createdEntries;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, COLLECTION_NAME);
    return createdEntries;
  }
}

export async function updateScoreEntry(id: string, updates: Partial<ScoreEntry>): Promise<void> {
  try {
    let extraWeekInfo = {};
    if (updates.date) {
      const dateObj = new Date(updates.date + 'T12:00:00');
      const weekInfo = getISOWeekInfo(dateObj);
      extraWeekInfo = {
        week: weekInfo.weekLabel,
        weekNumber: weekInfo.weekNumber,
        month: weekInfo.monthKey,
        monthLabel: weekInfo.monthLabel,
        year: weekInfo.year
      };
    }

    const cleanedUpdates: any = cleanForFirestore({
      ...updates,
      ...extraWeekInfo,
      updatedAt: new Date().toISOString()
    });

    if (updates.points !== undefined) {
      cleanedUpdates.total = Number(updates.points) || 0;
      cleanedUpdates.points = Number(updates.points) || 0;
    }

    if (updates.notes !== undefined) {
      cleanedUpdates.notes = (updates.notes || '').trim();
    }

    await setDoc(doc(db, COLLECTION_NAME, id), cleanedUpdates, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
}

export async function deleteScoreEntry(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
}
