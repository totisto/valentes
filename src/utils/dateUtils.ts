import { ScoreEntry, Student, RankingItem } from '../types';

export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Returns ISO week number and year for a given date
 */
export function getISOWeekInfo(dateInput: Date | string) {
  const date = typeof dateInput === 'string' ? new Date(dateInput + 'T12:00:00') : new Date(dateInput);
  
  // ISO week date days run from Monday (1) to Sunday (7)
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday is 0, Sunday is 6
  target.setDate(target.getDate() - dayNr + 3); // Thursday in same week
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = date.getFullYear();

  // Find Monday and Sunday of this week
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayNr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatShort = (d: Date) => 
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
  const monthKey = `${year}-${monthNumber}`;
  const monthLabel = `${MONTH_NAMES_PT[date.getMonth()]} de ${year}`;
  const weekLabel = `Semana ${weekNumber} (${formatShort(monday)} a ${formatShort(sunday)})`;

  return {
    weekNumber,
    year,
    weekLabel,
    monthKey,
    monthLabel,
    monday,
    sunday
  };
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatDateTimeBR(isoStr: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const dateFormatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeFormatted = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dateFormatted} às ${timeFormatted}`;
  } catch {
    return isoStr;
  }
}

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateEntryId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VAL-${dateStr}-${randomPart}`;
}

/**
 * Calculates rankings for students based on an array of score entries.
 * All students will appear, even those with 0 points.
 * Handles ties properly: students with the same score share the same position.
 */
export function calculateRanking(students: Student[], entries: ScoreEntry[]): RankingItem[] {
  // Aggregate points per student
  const aggregation = new Map<string, {
    totalPoints: number;
    count: number;
    categoryBreakdown: Record<string, number>;
    critTotals: {
      pontualidade: number;
      comportamento: number;
      presenca: number;
      participacao: number;
      atividade: number;
    };
  }>();

  // Initialize for all active students (ensures 0-point students appear!)
  students.forEach((student) => {
    aggregation.set(student.id, {
      totalPoints: 0,
      count: 0,
      categoryBreakdown: {},
      critTotals: {
        pontualidade: 0,
        comportamento: 0,
        presenca: 0,
        participacao: 0,
        atividade: 0,
      }
    });
  });

  // Sum up entries
  entries.forEach((entry) => {
    const current = aggregation.get(entry.studentId);
    if (current) {
      const pts = entry.points !== undefined ? Number(entry.points) : (Number((entry as any).total) || 0);
      current.totalPoints += pts;
      current.count += 1;
      const catName = entry.categoryName || 'Geral';
      current.categoryBreakdown[catName] = (current.categoryBreakdown[catName] || 0) + pts;

      current.critTotals.pontualidade += entry.pontualidade !== undefined ? entry.pontualidade : Math.min(10, Math.round(pts * 0.25));
      current.critTotals.comportamento += entry.comportamento !== undefined ? entry.comportamento : Math.min(10, Math.round(pts * 0.22));
      current.critTotals.presenca += entry.presenca !== undefined ? entry.presenca : Math.min(10, Math.round(pts * 0.24));
      current.critTotals.participacao += entry.participacao !== undefined ? entry.participacao : Math.min(10, Math.round(pts * 0.23));
      current.critTotals.atividade += entry.atividade !== undefined ? entry.atividade : Math.min(10, Math.round(pts * 0.20));
    }
  });

  // Convert to array and sort descending by totalPoints, then alphabetically by name
  const studentMap = new Map(students.map(s => [s.id, s.name]));
  
  const rawList = Array.from(aggregation.entries()).map(([studentId, data]) => {
    const studentName = studentMap.get(studentId) || 'Aluno';
    const c = Math.max(1, data.count);
    return {
      studentId,
      studentName,
      totalPoints: data.totalPoints,
      entryCount: data.count,
      categoryBreakdown: data.categoryBreakdown,
      averages: {
        pontualidade: data.count > 0 ? Number((data.critTotals.pontualidade / c).toFixed(1)) : 0,
        comportamento: data.count > 0 ? Number((data.critTotals.comportamento / c).toFixed(1)) : 0,
        presenca: data.count > 0 ? Number((data.critTotals.presenca / c).toFixed(1)) : 0,
        participacao: data.count > 0 ? Number((data.critTotals.participacao / c).toFixed(1)) : 0,
        atividade: data.count > 0 ? Number((data.critTotals.atividade / c).toFixed(1)) : 0,
      }
    };
  });

  // Sort descending by total points, then alphabetically
  rawList.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.studentName.localeCompare(b.studentName);
  });

  // Assign positions with tie handling (Standard Competition Ranking)
  const ranking: RankingItem[] = [];
  let currentPosition = 1;

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    
    // Check if this item is tied with previous or next item
    const tiedWithPrev = i > 0 && rawList[i - 1].totalPoints === item.totalPoints;
    const tiedWithNext = i < rawList.length - 1 && rawList[i + 1].totalPoints === item.totalPoints;
    const isTie = tiedWithPrev || tiedWithNext;

    if (i > 0 && item.totalPoints < rawList[i - 1].totalPoints) {
      currentPosition = i + 1;
    }

    ranking.push({
      position: currentPosition,
      isTie,
      studentId: item.studentId,
      studentName: item.studentName,
      totalPoints: item.totalPoints,
      entryCount: item.entryCount,
      categoryBreakdown: item.categoryBreakdown,
      averages: item.averages
    });
  }

  return ranking;
}
