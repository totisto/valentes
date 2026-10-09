import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { calculateRanking } from '../../utils/dateUtils';
import { LionBadge, ChampionCrown, BrushStroke } from '../common/BrandAssets';
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Flame,
  ShieldAlert,
  Plus,
  Zap
} from 'lucide-react';

export const AnnualRankingView: React.FC = () => {
  const { students, entries, openScoreUpdateModal, effectiveStudentId } = useApp();
  const { role } = useAuth();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Available distinct years
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    set.add(currentYear);
    entries.forEach((e) => set.add(e.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [entries, currentYear]);

  // Filter entries for selected year
  const yearEntries = useMemo(() => {
    return entries.filter((e) => e.year === selectedYear);
  }, [entries, selectedYear]);

  // Calculate annual ranking
  const ranking = useMemo(() => {
    return calculateRanking(students, yearEntries);
  }, [students, yearEntries]);

  const top1 = ranking[0];
  const top2 = ranking[1];
  const top3 = ranking[2];

  const totalPointsInYear = useMemo(() => {
    return yearEntries.reduce((acc, curr) => acc + (curr.points !== undefined ? curr.points : ((curr as any).total || 0)), 0);
  }, [yearEntries]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-12 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Campeonato Geral
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-blue-300">Temporada {selectedYear}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none">
            Ranking Anual dos Valentes
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

          {/* Year Selector */}
          <div className="flex items-center gap-2 bg-[#0B192C] border border-blue-900/80 p-1.5 rounded-2xl shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400 ml-2" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-amber-300 pr-3 py-1 focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-[#0B192C] text-white">
                  Ano {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hero Grand Champion Card */}
      {top1 && top1.totalPoints > 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-[#0B192C] to-amber-950/40 border-2 border-amber-400/50 rounded-3xl p-5 sm:p-7 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider">
                <ChampionCrown className="w-4 h-4 text-amber-400" />
                <span>Grande Líder do Ano {selectedYear}</span>
              </div>
              <h3 className="text-3xl sm:text-5xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none">
                {top1.studentName}
              </h3>
              <p className="text-xs sm:text-sm text-blue-200 max-w-md">
                Maior pontuação acumulada na temporada anual dos Valentes com{' '}
                <strong className="text-amber-300">{top1.totalPoints} pontos</strong> e{' '}
                {top1.entryCount} avaliações registradas.
              </p>
            </div>

            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-500 p-1 shadow-2xl shadow-amber-500/30 ring-4 ring-amber-400/30 flex items-center justify-center">
                <div className="w-full h-full bg-[#060D17] rounded-[20px] flex items-center justify-center">
                  <LionBadge className="w-14 h-14" />
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-3xl sm:text-4xl font-black text-amber-300 font-['Teko',sans-serif] leading-none">
                  {top1.totalPoints}
                </span>
                <span className="block text-[11px] font-bold text-slate-300 uppercase">
                  Pontos Totais
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-[#0B192C] border border-blue-900/60 text-center text-blue-300/80">
          Nenhum lançamento registrado no ano {selectedYear}.
        </div>
      )}

      {/* Annual Table of All 21 Students */}
      <div className="bg-[#0B192C] border border-blue-900/60 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-blue-900/60 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white font-['Teko',sans-serif] leading-none">
              Classificação Acumulada Anual
            </h3>
            <p className="text-xs text-blue-300/70">
              Soma total de todos os lançamentos do ano. Todos os 21 alunos classificados.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
            {totalPointsInYear.toLocaleString('pt-BR')} pts no total
          </span>
        </div>

        <div className="divide-y divide-blue-900/40">
          {ranking.map((item) => {
            const isExpanded = expandedStudentId === item.studentId;

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
              <div key={item.studentId} className="transition-colors hover:bg-blue-950/40">
                <div
                  onClick={() => setExpandedStudentId(isExpanded ? null : item.studentId)}
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
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
                          ? `${item.entryCount} avaliações no ano`
                          : '0 avaliações no ano'}
                      </p>
                    </div>
                  </div>

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
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Average Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-[#060D17]/90 border-t border-blue-950 animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider mb-2">
                      Médias dos Critérios no Ano {selectedYear}:
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
