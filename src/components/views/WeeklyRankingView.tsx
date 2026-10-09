import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { calculateRanking, getISOWeekInfo } from '../../utils/dateUtils';
import { LionBadge, ChampionCrown, BrushStroke } from '../common/BrandAssets';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Medal,
  Award,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Zap
} from 'lucide-react';

export const WeeklyRankingView: React.FC = () => {
  const { students, entries, openScoreUpdateModal, effectiveStudentId } = useApp();
  const { role } = useAuth();

  // Current ISO week as reference
  const currentWeekInfo = useMemo(() => getISOWeekInfo(new Date()), []);

  // Selected week key: e.g. "2026-W41"
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(currentWeekInfo.weekNumber);
  const [selectedYear, setSelectedYear] = useState<number>(currentWeekInfo.year);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Available distinct weeks in entries
  const availableWeeks = useMemo(() => {
    const map = new Map<string, { weekNumber: number; year: number; label: string }>();
    
    // Always include current week
    const currentKey = `${currentWeekInfo.year}-W${currentWeekInfo.weekNumber}`;
    map.set(currentKey, {
      weekNumber: currentWeekInfo.weekNumber,
      year: currentWeekInfo.year,
      label: currentWeekInfo.weekLabel
    });

    entries.forEach((e) => {
      const key = `${e.year}-W${e.weekNumber}`;
      if (!map.has(key)) {
        map.set(key, {
          weekNumber: e.weekNumber,
          year: e.year,
          label: e.week
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.weekNumber - a.weekNumber;
    });
  }, [entries, currentWeekInfo]);

  // Current selected week's label
  const selectedWeekLabel = useMemo(() => {
    const found = availableWeeks.find(
      (w) => w.weekNumber === selectedWeekNumber && w.year === selectedYear
    );
    return found ? found.label : `Semana ${selectedWeekNumber} / ${selectedYear}`;
  }, [availableWeeks, selectedWeekNumber, selectedYear]);

  // Filter entries for the selected week
  const weekEntries = useMemo(() => {
    return entries.filter(
      (e) => e.weekNumber === selectedWeekNumber && e.year === selectedYear
    );
  }, [entries, selectedWeekNumber, selectedYear]);

  // Calculate ranking with tie handling
  const ranking = useMemo(() => {
    return calculateRanking(students, weekEntries);
  }, [students, weekEntries]);

  // Navigate to previous/next week
  const handlePrevWeek = () => {
    const currentIndex = availableWeeks.findIndex(
      (w) => w.weekNumber === selectedWeekNumber && w.year === selectedYear
    );
    if (currentIndex < availableWeeks.length - 1) {
      const prev = availableWeeks[currentIndex + 1];
      setSelectedWeekNumber(prev.weekNumber);
      setSelectedYear(prev.year);
    }
  };

  const handleNextWeek = () => {
    const currentIndex = availableWeeks.findIndex(
      (w) => w.weekNumber === selectedWeekNumber && w.year === selectedYear
    );
    if (currentIndex > 0) {
      const next = availableWeeks[currentIndex - 1];
      setSelectedWeekNumber(next.weekNumber);
      setSelectedYear(next.year);
    }
  };

  const top1 = ranking[0];
  const top2 = ranking[1];
  const top3 = ranking[2];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-12 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Classificação Periódica
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-blue-300">Todos os 21 Alunos</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none">
            Ranking Semanal
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {role !== 'student' && (
            <button
              onClick={() => openScoreUpdateModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              title="Lançar ou atualizar pontos de um aluno agora"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 stroke-[2.5]" />
              <span>Atualizar Pontos</span>
            </button>
          )}

          {/* Week Selector Navigator */}
          <div className="flex items-center gap-1.5 bg-[#0B192C] border border-blue-900/80 p-1 rounded-2xl shadow-lg">
            <button
              onClick={handlePrevWeek}
              disabled={
                availableWeeks.findIndex(
                  (w) => w.weekNumber === selectedWeekNumber && w.year === selectedYear
                ) >=
                availableWeeks.length - 1
              }
              className="p-2 rounded-xl text-blue-300 hover:text-white hover:bg-blue-900/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Semana Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={`${selectedYear}-W${selectedWeekNumber}`}
              onChange={(e) => {
                const [y, w] = e.target.value.split('-W');
                setSelectedYear(Number(y));
                setSelectedWeekNumber(Number(w));
              }}
              className="bg-transparent text-xs sm:text-sm font-bold text-amber-300 px-2 py-1.5 focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              {availableWeeks.map((w) => (
                <option
                  key={`${w.year}-W${w.weekNumber}`}
                  value={`${w.year}-W${w.weekNumber}`}
                  className="bg-[#0B192C] text-white"
                >
                  {w.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextWeek}
              disabled={
                availableWeeks.findIndex(
                  (w) => w.weekNumber === selectedWeekNumber && w.year === selectedYear
                ) <= 0
              }
              className="p-2 rounded-xl text-blue-300 hover:text-white hover:bg-blue-900/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Próxima Semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Title & Summary */}
      <div className="bg-[#0B192C] border border-blue-900/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{selectedWeekLabel}</h3>
            <p className="text-xs text-blue-300/70">
              Total de {weekEntries.length} lançamentos contabilizados nesta semana
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20">
          <ChampionCrown className="w-4 h-4" />
          <span>Líder: {top1 ? `${top1.studentName} (${top1.totalPoints} pts)` : 'Nenhum'}</span>
        </div>
      </div>

      {/* Top 3 Podium Visual Card */}
      {top1 && top1.totalPoints > 0 && (
        <div className="bg-gradient-to-b from-[#0B192C] to-[#060D17] border border-blue-900/60 rounded-3xl p-4 sm:p-6 shadow-xl">
          <div className="text-center mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              PÓDIO DE HONRA DOS VALENTES
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto items-end pt-4 pb-2">
            {/* 2nd Place */}
            {top2 && (
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-slate-300 mb-1">2º LUGAR</span>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-400/20 border-2 border-slate-300 flex items-center justify-center mb-2 shadow-lg">
                  <Medal className="w-7 h-7 text-slate-300" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[85px]">
                  {top2.studentName}
                </h4>
                <span className="text-lg sm:text-2xl font-black text-slate-200 font-['Teko',sans-serif] leading-tight">
                  {top2.totalPoints} pts
                </span>
              </div>
            )}

            {/* 1st Place */}
            {top1 && (
              <div className="flex flex-col items-center text-center -translate-y-2">
                <ChampionCrown className="w-8 h-8 text-amber-400 mb-1 animate-pulse" />
                <span className="text-[11px] font-black text-amber-400 mb-1 tracking-wider">
                  CAMPEÃO
                </span>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mb-2 shadow-2xl shadow-amber-500/30">
                  <LionBadge className="w-10 h-10" />
                </div>
                <h4 className="text-sm sm:text-base font-black text-white truncate max-w-[100px]">
                  {top1.studentName}
                </h4>
                <span className="text-2xl sm:text-3xl font-black text-amber-300 font-['Teko',sans-serif] leading-tight">
                  {top1.totalPoints} pts
                </span>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-amber-600 mb-1">3º LUGAR</span>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-700/20 border-2 border-amber-700 flex items-center justify-center mb-2 shadow-lg">
                  <Award className="w-7 h-7 text-amber-600" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[85px]">
                  {top3.studentName}
                </h4>
                <span className="text-lg sm:text-2xl font-black text-amber-600 font-['Teko',sans-serif] leading-tight">
                  {top3.totalPoints} pts
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Table / Cards of all 21 students */}
      <div className="bg-[#0B192C] border border-blue-900/60 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-blue-900/60 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white font-['Teko',sans-serif] leading-none">
              Classificação Geral da Semana
            </h3>
            <p className="text-xs text-blue-300/70">
              Ordenado da maior para a menor pontuação. Toque para ver detalhes dos critérios.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-300 bg-blue-900/40 px-2.5 py-1 rounded-lg">
            21 Valentes
          </span>
        </div>

        <div className="divide-y divide-blue-900/40">
          {ranking.map((item) => {
            const isExpanded = expandedStudentId === item.studentId;

            // Podium colors
            let posBadge = 'bg-blue-950 text-blue-300 border border-blue-800';
            let nameColor = 'text-white';
            if (item.position === 1) {
              posBadge = 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20';
              nameColor = 'text-amber-300 font-black';
            } else if (item.position === 2) {
              posBadge = 'bg-slate-300 text-slate-950 font-bold';
            } else if (item.position === 3) {
              posBadge = 'bg-amber-700 text-white font-bold';
            }

            return (
              <div
                key={item.studentId}
                className="transition-colors hover:bg-blue-950/40"
              >
                <div
                  onClick={() =>
                    setExpandedStudentId(isExpanded ? null : item.studentId)
                  }
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  {/* Position & Name */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm sm:text-base font-black flex-shrink-0 ${posBadge}`}
                    >
                      {item.position}º
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm sm:text-base font-bold truncate ${nameColor}`}>
                          {item.studentName}
                        </h4>
                        {item.studentId === effectiveStudentId && role === 'student' && (
                          <span className="text-[10px] font-black uppercase bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded shadow">
                            Você
                          </span>
                        )}
                        {item.isTie && (
                          <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.2 rounded font-semibold">
                            Empate
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-300/60 truncate">
                        {item.entryCount > 0
                          ? `${item.entryCount} lançamento${item.entryCount > 1 ? 's' : ''}`
                          : 'Nenhum lançamento registrado'}
                      </p>
                    </div>
                  </div>

                  {/* Score & Toggle */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {role !== 'student' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openScoreUpdateModal(item.studentId);
                        }}
                        className="px-2 sm:px-2.5 py-1 rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 font-black text-[11px] uppercase tracking-wider border border-amber-400/40 transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                        title={`Lançar ou atualizar pontos de ${item.studentName}`}
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>+ Pontos</span>
                      </button>
                    )}

                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black text-amber-300 font-['Teko',sans-serif] leading-none">
                        {item.totalPoints}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium">pontos</span>
                    </div>

                    <div className="text-blue-400 hover:text-white transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Average Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-[#060D17]/90 border-t border-blue-950 animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider mb-2">
                      Médias dos 5 Critérios nesta semana:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-900/40">
                        <span className="text-slate-400 block text-[10px] uppercase">Pontualidade</span>
                        <span className="text-sm font-bold text-amber-400">{item.averages.pontualidade} / 10</span>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-900/40">
                        <span className="text-slate-400 block text-[10px] uppercase">Comportamento</span>
                        <span className="text-sm font-bold text-blue-400">{item.averages.comportamento} / 10</span>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-900/40">
                        <span className="text-slate-400 block text-[10px] uppercase">Presença</span>
                        <span className="text-sm font-bold text-emerald-400">{item.averages.presenca} / 10</span>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-900/40">
                        <span className="text-slate-400 block text-[10px] uppercase">Participação</span>
                        <span className="text-sm font-bold text-purple-400">{item.averages.participacao} / 10</span>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-900/40 col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block text-[10px] uppercase">Atividade</span>
                        <span className="text-sm font-bold text-rose-400">{item.averages.atividade} / 10</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
