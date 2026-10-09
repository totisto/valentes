import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { calculateRanking, getISOWeekInfo, getTodayDateStr } from '../../utils/dateUtils';
import { LionBadge, ChampionCrown, BrushStroke } from '../common/BrandAssets';
import { InstallAppModal } from '../modals/InstallAppModal';
import {
  Trophy,
  PlusCircle,
  History,
  CalendarDays,
  CalendarRange,
  Users,
  Flame,
  Award,
  ArrowRight,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Download,
  GraduationCap,
  Zap,
  Bell,
  Clock,
  Radio
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    students,
    teachers,
    entries,
    setActiveTab,
    activeTeacher,
    activeStudent,
    activeStudentId,
    setActiveStudentId,
    notificationsList,
    isOnline,
    openScoreUpdateModal
  } = useApp();
  const { role, isAdmin, userProfile } = useAuth();
  const userRole = role === 'student' ? 'aluno' : 'professor';

  const [showInstallModal, setShowInstallModal] = useState(false);

  const todayStr = getTodayDateStr();
  const currentWeek = useMemo(() => getISOWeekInfo(new Date()), []);

  // Filter entries for the current week for the main dashboard leader highlight
  const currentWeekEntries = useMemo(() => {
    return entries.filter(
      (e) => e.weekNumber === currentWeek.weekNumber && e.year === currentWeek.year
    );
  }, [entries, currentWeek]);

  // Weekly ranking
  const weeklyRanking = useMemo(() => {
    return calculateRanking(students, currentWeekEntries);
  }, [students, currentWeekEntries]);

  // Top 3 for podium
  const top1 = weeklyRanking[0];
  const top2 = weeklyRanking[1];
  const top3 = weeklyRanking[2];

  // Stats
  const totalPointsRecorded = useMemo(() => {
    return entries.reduce((acc, curr) => acc + (curr.points !== undefined ? curr.points : ((curr as any).total || 0)), 0);
  }, [entries]);

  const entriesTodayCount = useMemo(() => {
    return entries.filter((e) => e.date === todayStr).length;
  }, [entries, todayStr]);

  const averagePerStudent = useMemo(() => {
    if (students.length === 0) return 0;
    return Math.round(totalPointsRecorded / students.length);
  }, [totalPointsRecorded, students.length]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-12 space-y-6">
      {/* Active User Connected Bar (Adapts to Professor or Aluno) */}
      <div className="bg-[#0B192C] border border-blue-900/60 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md ${
              userRole === 'aluno'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950'
            }`}
          >
            {userRole === 'aluno'
              ? activeStudent?.name.charAt(0) || 'A'
              : activeTeacher?.name ? activeTeacher.name.replace('Prof. ', '').replace('Profª. ', '').charAt(0) : 'P'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {userRole === 'aluno' ? 'Aluno dos Valentes' : 'Professor Responsável'}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[11px] text-blue-300">
                {userRole === 'aluno'
                  ? 'Acesso Exclusivo a Rankings & Notas'
                  : activeTeacher?.role === 'coordenador' ? 'Coordenação' : 'Docente'}
              </span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-white leading-tight">
              {userRole === 'aluno'
                ? activeStudent?.name || userProfile?.name || 'Aluno Valente'
                : userProfile?.name || activeTeacher?.name || 'Professor'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 text-xs font-bold transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar App</span>
          </button>
        </div>
      </div>

      {/* Hero Banner with Valentes Athletic Spirit */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#0D223F] to-[#060D17] border border-blue-800/60 p-5 sm:p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <LionBadge className="w-4 h-4" />
              <span>
                {userRole === 'aluno'
                  ? 'Área do Aluno · Acompanhamento de Desempenho'
                  : 'Grupo Valentes · Temporada Ativa'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white font-['Teko',sans-serif] tracking-wider uppercase leading-none">
              Ranking dos Valentes
            </h1>

            <p className="text-sm sm:text-base text-blue-200/90 max-w-xl font-medium">
              {userRole === 'aluno'
                ? 'Consulte sua classificação semanal, mensal e anual, além do histórico diário das suas avaliações.'
                : 'Painel diário de liderança, pontualidade, disciplina e honra. Acompanhe a pontuação dos 21 adolescentes em tempo real.'}
            </p>

            <div className="pt-1">
              <BrushStroke className="w-36 h-3" color="#FACC15" />
            </div>
          </div>

          {/* Action Buttons: Depends on Role */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 flex-shrink-0">
            {userRole === 'professor' ? (
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <button
                  onClick={() => openScoreUpdateModal()}
                  className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  title="Abrir modal de atualização de pontos instantânea"
                >
                  <Zap className="w-5 h-5 fill-slate-950 stroke-[2.5]" />
                  <span>Atualizar Pontos</span>
                </button>
                <button
                  onClick={() => setActiveTab('lancamento')}
                  className="px-4 py-3.5 rounded-2xl bg-blue-900/80 hover:bg-blue-850 border border-blue-700/60 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  title="Ir para tela de lançamento completo"
                >
                  <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                  <span>Lançamento Completo</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('minhas-notas')}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 font-black text-base sm:text-lg uppercase tracking-wider shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <Award className="w-6 h-6 stroke-[2.5]" />
                <span>Minhas Notas</span>
              </button>
            )}

            <button
              onClick={() => setShowInstallModal(true)}
              className="px-4 py-3.5 rounded-2xl bg-blue-900/60 hover:bg-blue-800 border border-blue-700/60 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Instalar App</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-6 pt-6 border-t border-blue-900/60">
          <div className="bg-[#060D17]/80 p-3 sm:p-4 rounded-xl border border-blue-900/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Valentes</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white font-['Teko',sans-serif] mt-1 leading-none">
              {students.length}
            </p>
            <p className="text-[11px] text-blue-300/60 font-medium">adolescentes ativos</p>
          </div>

          <div className="bg-[#060D17]/80 p-3 sm:p-4 rounded-xl border border-blue-900/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pontos Totais</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-300 font-['Teko',sans-serif] mt-1 leading-none">
              {totalPointsRecorded.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] text-blue-300/60 font-medium">acumulados no ano</p>
          </div>

          <div className="bg-[#060D17]/80 p-3 sm:p-4 rounded-xl border border-blue-900/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Hoje ({todayStr.slice(8, 10)}/{todayStr.slice(5, 7)})</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-['Teko',sans-serif] mt-1 leading-none">
              {entriesTodayCount}
            </p>
            <p className="text-[11px] text-blue-300/60 font-medium">salvos diariamente</p>
          </div>

          <div className="bg-[#060D17]/80 p-3 sm:p-4 rounded-xl border border-blue-900/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 uppercase">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Média Geral</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-300 font-['Teko',sans-serif] mt-1 leading-none">
              {averagePerStudent} pts
            </p>
            <p className="text-[11px] text-blue-300/60 font-medium">por adolescente</p>
          </div>
        </div>
      </div>

      {/* Podium of the Week (Top 3 Valentes) */}
      <div className="bg-[#0B192C] rounded-3xl border border-blue-900/60 p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <ChampionCrown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Destaques da {currentWeek.weekLabel}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none">
              Pódio dos Valentes
            </h2>
          </div>

          <button
            onClick={() => setActiveTab('semanal')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-amber-300 transition-colors"
          >
            <span>Ver Ranking Semanal Completo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Step Visual Podium */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto items-end pt-8 pb-2">
          {/* 2nd Place */}
          {top2 && (
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-slate-200 to-slate-400 p-0.5 shadow-lg shadow-slate-500/20">
                  <div className="w-full h-full bg-[#0B192C] rounded-[14px] flex flex-col items-center justify-center p-1">
                    <span className="text-xs sm:text-sm font-black text-slate-300 uppercase">
                      2º
                    </span>
                    <span className="text-xs sm:text-base font-bold text-white truncate max-w-[80px]">
                      {top2.studentName}
                    </span>
                  </div>
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                  PRATA
                </div>
              </div>
              <div className="w-full bg-slate-800/80 rounded-t-xl py-3 px-2 border-t border-slate-400/40 text-center">
                <span className="text-xl sm:text-2xl font-black text-slate-200 font-['Teko',sans-serif] leading-none">
                  {top2.totalPoints}
                </span>
                <span className="block text-[10px] text-slate-400">pontos</span>
                {userRole === 'professor' && (
                  <button
                    type="button"
                    onClick={() => openScoreUpdateModal(top2.studentId)}
                    className="mt-1 px-2 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                    title={`Atualizar pontos de ${top2.studentName}`}
                  >
                    + Pontos
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 1st Place (Champion - Elevated) */}
          {top1 && (
            <div className="flex flex-col items-center text-center -translate-y-4">
              <div className="relative mb-2">
                <ChampionCrown className="w-8 h-8 sm:w-10 sm:h-10 mx-auto -mb-1 animate-bounce duration-1000" />
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-1 shadow-2xl shadow-amber-500/40 ring-4 ring-amber-400/30">
                  <div className="w-full h-full bg-[#060D17] rounded-[12px] flex flex-col items-center justify-center p-1">
                    <span className="text-sm sm:text-base font-black text-amber-400 uppercase font-['Teko',sans-serif]">
                      1º LUGAR
                    </span>
                    <span className="text-sm sm:text-lg font-black text-white truncate max-w-[90px]">
                      {top1.studentName}
                    </span>
                  </div>
                </div>
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg">
                  OURO
                </div>
              </div>
              <div className="w-full bg-gradient-to-b from-amber-500/20 to-blue-900/60 rounded-t-2xl py-5 px-2 border-t-2 border-amber-400 text-center shadow-lg">
                <span className="text-2xl sm:text-4xl font-black text-amber-300 font-['Teko',sans-serif] leading-none">
                  {top1.totalPoints}
                </span>
                <span className="block text-[11px] text-amber-200/80 font-bold">pontos</span>
                {userRole === 'professor' && (
                  <button
                    type="button"
                    onClick={() => openScoreUpdateModal(top1.studentId)}
                    className="mt-1.5 px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/30 transition-all active:scale-95 cursor-pointer"
                    title={`Atualizar pontos de ${top1.studentName}`}
                  >
                    + Pontos
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-amber-700 to-amber-900 p-0.5 shadow-lg shadow-amber-900/20">
                  <div className="w-full h-full bg-[#0B192C] rounded-[14px] flex flex-col items-center justify-center p-1">
                    <span className="text-xs sm:text-sm font-black text-amber-600 uppercase">
                      3º
                    </span>
                    <span className="text-xs sm:text-base font-bold text-white truncate max-w-[80px]">
                      {top3.studentName}
                    </span>
                  </div>
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                  BRONZE
                </div>
              </div>
              <div className="w-full bg-amber-950/40 rounded-t-xl py-2 px-2 border-t border-amber-700/40 text-center">
                <span className="text-xl sm:text-2xl font-black text-amber-500 font-['Teko',sans-serif] leading-none">
                  {top3.totalPoints}
                </span>
                <span className="block text-[10px] text-slate-400">pontos</span>
                {userRole === 'professor' && (
                  <button
                    type="button"
                    onClick={() => openScoreUpdateModal(top3.studentId)}
                    className="mt-1 px-2 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                    title={`Atualizar pontos de ${top3.studentName}`}
                  >
                    + Pontos
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Modules Grid */}
      <div>
        <h3 className="text-lg font-black uppercase tracking-wider text-white font-['Teko',sans-serif] mb-3">
          Acesso aos Rankings e Módulos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Module 1: Minhas Notas (for Student) or Lançamento (for Professor) */}
          {userRole === 'aluno' ? (
            <button
              onClick={() => setActiveTab('minhas-notas')}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 to-blue-950 border border-amber-500/60 hover:border-amber-400 text-left transition-all hover:scale-[1.02] active:scale-95 group shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center mb-3 shadow-md shadow-amber-500/20">
                <Award className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                Minhas Notas
              </h4>
              <p className="text-xs text-blue-200/70 mt-1">
                Veja seu desempenho detalhado por critério e histórico.
              </p>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('lancamento')}
              className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/60 to-blue-950 border border-blue-700/60 hover:border-amber-400 text-left transition-all hover:scale-[1.02] active:scale-95 group shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center mb-3 shadow-md shadow-amber-500/20">
                <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                Lançar Pontuação
              </h4>
              <p className="text-xs text-blue-200/70 mt-1">
                Registro diário rápido em poucos segundos pelo celular.
              </p>
            </button>
          )}

          {/* Ranking Semanal */}
          <button
            onClick={() => setActiveTab('semanal')}
            className="p-4 rounded-2xl bg-[#0B192C] border border-blue-900/60 hover:border-blue-500 text-left transition-all hover:scale-[1.02] active:scale-95 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center mb-3">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
              Ranking Semanal
            </h4>
            <p className="text-xs text-blue-200/70 mt-1">
              Pontuação somada da semana atual com pódio.
            </p>
          </button>

          {/* Ranking Mensal */}
          <button
            onClick={() => setActiveTab('mensal')}
            className="p-4 rounded-2xl bg-[#0B192C] border border-blue-900/60 hover:border-blue-500 text-left transition-all hover:scale-[1.02] active:scale-95 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center mb-3">
              <CalendarRange className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
              Ranking Mensal
            </h4>
            <p className="text-xs text-blue-200/70 mt-1">
              Todos os 21 alunos classificados no mês selecionado.
            </p>
          </button>

          {/* Ranking Anual */}
          <button
            onClick={() => setActiveTab('anual')}
            className="p-4 rounded-2xl bg-[#0B192C] border border-blue-900/60 hover:border-amber-400 text-left transition-all hover:scale-[1.02] active:scale-95 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Trophy className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
              Ranking Anual
            </h4>
            <p className="text-xs text-blue-200/70 mt-1">
              Acumulado geral de honra e liderança do ano.
            </p>
          </button>
        </div>
      </div>

      {/* Real-time Live Feed of Teacher Score Updates */}
      <div className="bg-[#0B192C] rounded-3xl border-2 border-blue-800/80 p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 flex-shrink-0">
              <Zap className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white font-['Teko',sans-serif] leading-none">
                  Atualizações dos Professores em Tempo Real
                </h3>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Lançamentos e edições sincronizados instantaneamente para todos os alunos e professores
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold self-start sm:self-auto">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Sistema 100% Ao Vivo</span>
          </div>
        </div>

        {/* Live Items */}
        <div className="space-y-2.5">
          {(notificationsList.length > 0 ? notificationsList.slice(0, 4) : entries.slice(0, 4).map(e => ({
            id: e.id,
            type: 'score_created' as const,
            message: `${e.teacherName} registrou a pontuação de ${e.studentName}`,
            teacherName: e.teacherName,
            studentName: e.studentName,
            total: e.points !== undefined ? e.points : ((e as any).total || 0),
            scores: {
              pontualidade: e.pontualidade ?? 10,
              comportamento: e.comportamento ?? 10,
              presenca: e.presenca ?? 10,
              participacao: e.participacao ?? 10,
              atividade: e.atividade ?? 10
            },
            timestamp: e.createdAt
          }))).map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.studentName) {
                  const found = students.find(s => s.name === item.studentName);
                  if (found) setActiveStudentId(found.id);
                }
                if (userRole === 'aluno') {
                  setActiveTab('minhas-notas');
                } else {
                  setActiveTab('semanal');
                }
              }}
              className="p-3 sm:p-3.5 rounded-2xl bg-[#060D17]/90 border border-blue-900/60 hover:border-amber-400/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer group hover:bg-[#071324]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-900/60 text-blue-300 border border-blue-700/50 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                  {item.teacherName ? item.teacherName.replace('Prof. ', '').replace('Profª. ', '').charAt(0) : 'P'}
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-200">
                    <strong className="text-white font-extrabold">{item.teacherName || 'Professor'}</strong>{' '}
                    lançou a nota de{' '}
                    <strong className="text-amber-300 font-extrabold group-hover:underline">
                      {item.studentName}
                    </strong>
                  </p>
                  {item.scores && (
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-300/70 font-semibold mt-0.5">
                      <span>Pont: {item.scores.pontualidade}</span>
                      <span>·</span>
                      <span>Comp: {item.scores.comportamento}</span>
                      <span>·</span>
                      <span>Pres: {item.scores.presenca}</span>
                      <span>·</span>
                      <span>Part: {item.scores.participacao}</span>
                      <span>·</span>
                      <span>Ativ: {item.scores.atividade}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Atualizado</span>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 font-black text-sm font-['Teko',sans-serif] tracking-wider uppercase">
                  +{item.total} PTS
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>

        {/* Live sync description */}
        <div className="mt-4 pt-3 border-t border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-blue-200/80">
          <p className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>O sistema recalcula automaticamente os rankings semanal, mensal e anual a cada lançamento.</span>
          </p>
          <span className="text-emerald-400 font-bold flex-shrink-0">
            ✓ Atualização sem recarregar a tela
          </span>
        </div>
      </div>

      {/* Top 5 Valentes Leaderboard Preview */}
      <div className="bg-[#0B192C] rounded-2xl border border-blue-900/50 p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LionBadge className="w-5 h-5" />
            <h3 className="text-lg font-black uppercase tracking-wider text-white font-['Teko',sans-serif] leading-none">
              Top 5 Valentes da Semana
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('semanal')}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            Ver todos os 21 alunos <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-blue-900/40">
          {weeklyRanking.slice(0, 5).map((item) => (
            <div
              key={item.studentId}
              className="py-2.5 flex items-center justify-between gap-3 hover:bg-blue-950/30 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                    item.position === 1
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : item.position === 2
                      ? 'bg-slate-300 text-slate-950'
                      : item.position === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}
                >
                  {item.position}º
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {item.studentName}
                    {item.isTie && (
                      <span className="text-[10px] text-amber-400 font-semibold">(empate)</span>
                    )}
                  </h4>
                  <p className="text-[11px] text-blue-300/60">
                    {item.entryCount} lançamentos na semana
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-amber-300 font-['Teko',sans-serif] leading-none">
                  {item.totalPoints}
                </span>
                <span className="text-xs text-slate-400 ml-1">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
