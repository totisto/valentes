export type Role = 'admin' | 'teacher' | 'coordenador';

export interface UserProfile {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  role: Role | 'student';
  studentId?: string; // Reference to canonical Student.id (e.g. 'std-1', 'std-3', or official student id)
  active: boolean;
  avatarSeed?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Student {
  id: string; // Canonical Student ID (e.g. 'std-1' ... 'std-21' or created official id)
  name: string;
  email?: string;
  authUid?: string; // Link to Firebase Auth user UID
  active: boolean;
  avatarSeed?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  defaultPoints?: number;
  iconName?: string;
  createdAt: string;
}

export interface ScoreEntry {
  id: string;
  studentId: string;
  studentName: string;
  points: number;
  total?: number; // legacy alias
  categoryId?: string;
  categoryName?: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  week: string; // e.g. "Semana 41 (05/10 a 11/10)"
  weekNumber: number; // 1 to 53
  month: string; // YYYY-MM
  monthLabel?: string; // e.g. "Outubro de 2026"
  year: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;

  // Criteria scores (for backwards compatibility & detail)
  pontualidade?: number;
  comportamento?: number;
  presenca?: number;
  participacao?: number;
  atividade?: number;
}

export interface CriteriaAverages {
  pontualidade: number;
  comportamento: number;
  presenca: number;
  participacao: number;
  atividade: number;
}

export interface RankingItem {
  position: number;
  isTie: boolean;
  studentId: string;
  studentName: string;
  totalPoints: number;
  entryCount: number;
  categoryBreakdown?: Record<string, number>;
  averages: CriteriaAverages;
}

export interface QuickScoreLaunch {
  studentId: string;
  studentName: string;
  points: number;
}

export type ActiveTab =
  | 'dashboard'
  | 'lancamento'
  | 'lancamento-rapido'
  | 'historico'
  | 'semanal'
  | 'mensal'
  | 'anual'
  | 'relatorios'
  | 'minhas-notas'
  | 'admin'
  | 'perfil';

export interface LiveNotification {
  id: string;
  type: 'score_created' | 'score_updated' | 'score_deleted' | 'system';
  message: string;
  teacherName?: string;
  studentName?: string;
  studentId?: string;
  categoryName?: string;
  total?: number;
  points?: number;
  scores?: {
    pontualidade?: number;
    comportamento?: number;
    presenca?: number;
    participacao?: number;
    atividade?: number;
  };
  date?: string;
  timestamp: string;
  forActiveStudent?: boolean;
}
