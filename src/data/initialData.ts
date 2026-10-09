import { Student, UserProfile, Category, ScoreEntry } from '../types';
import { getISOWeekInfo } from '../utils/dateUtils';

export const INITIAL_STUDENTS_NAMES: string[] = [
  'Beatriz',
  'Damares',
  'Davi',
  'Denis',
  'Eduardo',
  'Franciele',
  'Gabriel',
  'Guilherme',
  'Hadassa',
  'Iam',
  'Isac',
  'Jhon',
  'João',
  'Liardson',
  'Lucas',
  'Miguel',
  'Naira',
  'Pedro',
  'Pietro',
  'Samuel',
  'Vanessa'
];

export const INITIAL_STUDENTS: Student[] = INITIAL_STUDENTS_NAMES.map((name, index) => ({
  id: `std-${index + 1}`,
  name,
  active: true,
  avatarSeed: name.toLowerCase(),
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
}));

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-presenca', name: 'Presença', description: 'Assiduidade nas reuniões e encontros', active: true, defaultPoints: 10, iconName: 'UserCheck', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-participacao', name: 'Participação', description: 'Envolvimento ativo nas discussões e tarefas', active: true, defaultPoints: 10, iconName: 'Award', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-comportamento', name: 'Comportamento', description: 'Disciplina, postura de honra e respeito', active: true, defaultPoints: 10, iconName: 'HeartHandshake', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-atividade', name: 'Atividade', description: 'Cumprimento de tarefas práticas e desafios', active: true, defaultPoints: 10, iconName: 'BookOpen', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-memorizacao', name: 'Memorização', description: 'Memorização de versículos, lemas e princípios', active: true, defaultPoints: 10, iconName: 'Sparkles', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-dinamica', name: 'Dinâmica', description: 'Desempenho em jogos coletivos e gincanas', active: true, defaultPoints: 10, iconName: 'Flame', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-outros', name: 'Outros', description: 'Pontuações especiais, bônus e iniciativas extras', active: true, defaultPoints: 5, iconName: 'PlusCircle', createdAt: '2026-01-01T00:00:00Z' }
];

export const INITIAL_TEACHERS: UserProfile[] = [
  {
    id: 'admin-lucas',
    name: 'Lucas (Administrador)',
    email: 'lucasj6k@gmail.com',
    role: 'admin',
    active: true,
    avatarSeed: 'lucas',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    lastLogin: 'Admin Autorizado'
  }
];

export function generateSeedEntries(students: Student[], teachers: UserProfile[]): ScoreEntry[] {
  const entries: ScoreEntry[] = [];
  const today = new Date();

  const studentTargetPoints: Record<string, number> = {
    'Isac': 432,
    'Franciele': 420,
    'Hadassa': 385,
    'Davi': 375,
    'Lucas': 368,
    'Beatriz': 360,
    'Miguel': 352,
    'Gabriel': 345,
    'Samuel': 340,
    'Vanessa': 335,
    'João': 328,
    'Pedro': 320,
    'Eduardo': 315,
    'Guilherme': 310,
    'Pietro': 300,
    'Naira': 295,
    'Damares': 290,
    'Denis': 285,
    'Jhon': 275,
    'Liardson': 260,
    'Iam': 250
  };

  const dayOffsets = [0, -1, -2, -3, -4, -5, -6, -7, -8];

  students.forEach((student, sIdx) => {
    const target = studentTargetPoints[student.name] || 300;
    const averagePerDay = Math.round(target / dayOffsets.length);

    dayOffsets.forEach((dayOffset, dIdx) => {
      const entryDate = new Date(today);
      entryDate.setDate(today.getDate() + dayOffset);
      const dateStr = entryDate.toISOString().slice(0, 10);
      const weekInfo = getISOWeekInfo(entryDate);
      const teacher = teachers[(sIdx + dIdx) % teachers.length];
      const category = INITIAL_CATEGORIES[dIdx % INITIAL_CATEGORIES.length];

      const variation = ((sIdx * 3 + dIdx * 7) % 7) - 3;
      const points = Math.min(50, Math.max(10, averagePerDay + variation));

      const timeHour = 9 + (dIdx % 8);
      const timeMin = (sIdx * 3) % 60;
      const entryTime = `${String(timeHour).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}:00`;

      entries.push({
        id: `VAL-${dateStr.replace(/-/g, '')}-${student.id}-${dIdx + 1}`,
        studentId: student.id,
        studentName: student.name,
        points,
        categoryId: category.id,
        categoryName: category.name,
        teacherId: teacher.id,
        teacherName: teacher.name,
        date: dateStr,
        week: weekInfo.weekLabel,
        weekNumber: weekInfo.weekNumber,
        month: weekInfo.monthKey,
        monthLabel: weekInfo.monthLabel,
        year: weekInfo.year,
        notes: '',
        total: points,
        pontualidade: 10,
        comportamento: 10,
        presenca: 10,
        participacao: 10,
        atividade: 10,
        createdAt: `${dateStr}T${entryTime}Z`,
        updatedAt: `${dateStr}T${entryTime}Z`
      });
    });
  });

  return entries;
}
