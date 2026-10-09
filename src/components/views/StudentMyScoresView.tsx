import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { calculateRanking, getISOWeekInfo, formatDateBR, formatDateTimeBR } from '../../utils/dateUtils';
import { LionBadge, ChampionCrown, BrushStroke } from '../common/BrandAssets';
import {
  Trophy,
  CalendarDays,
  CalendarRange,
  Award,
  Sparkles,
  Clock,
  HeartHandshake,
  UserCheck,
  BookOpen,
  ArrowRight,
  User,
  Zap,
  Bell,
  AlertCircle
} from 'lucide-react';

export const StudentMyScoresView: React.FC = () => {
  const {
    students,
    entries,
    effectiveStudentId,
    activeStudent,
    setActiveTab,
    notificationsList
  } = useApp();
  const { userProfile } = useAuth();

  // Check if there was a recent live update for this student (filtered by studentId)
  const recentStudentUpdate = useMemo(() => {
    return notificationsList.find(
      (n) => n.studentId === effectiveStudentId
    );
  }, [notificationsList, effectiveStudentId]);

  // Filter entries strictly for this specific student
  const studentEntries = useMemo(() => {
    if (!effectiveStudentId) return [];
    return entries.filter((e) => e.studentId === effectiveStudentId);
  }, [entries, effectiveStudentId]);

  // Total points for student
  const totalPoints = useMemo(() => {
    return studentEntries.reduce(
      (acc, curr) => acc + (curr.points !== undefined ? curr.points : ((curr as any).total || 0)),
      0
    );
  }, [studentEntries]);

  // Current Week ranking position
  const currentWeekInfo = useMemo(() => getISOWeekInfo(new Date()), []);
  const weekEntries = useMemo(() => {
    return entries.filter(
      (e) => e.weekNumber === currentWeekInfo.weekNumber && e.year === currentWeekInfo.year
    );
  }, [entries, currentWeekInfo]);

  const weeklyRanking = useMemo(() => calculateRanking(students, weekEntries), [students, weekEntries]);
  const myWeeklyRank = useMemo(() => {
    if (!effectiveStudentId) return undefined;
    return weeklyRanking.find((r) => r.studentId === effectiveStudentId);
  }, [weeklyRanking, effectiveStudentId]);

  // Monthly ranking position
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const monthEntries = useMemo(() => entries.filter((e) => e.month === currentMonthKey), [entries, currentMonthKey]);
  const monthlyRanking = useMemo(() => calculateRanking(students, monthEntries), [students, monthEntries]);
  const myMonthlyRank = useMemo(() => {
    if (!effectiveStudentId) return undefined;
    return monthlyRanking.find((r) => r.studentId === effectiveStudentId);
  }, [monthlyRanking, effectiveStudentId]);

  // Annual ranking position
  const annualRanking = useMemo(() => calculateRanking(students, entries), [students, entries]);
  const myAnnualRank = useMemo(() => {
    if (!effectiveStudentId) return undefined;
    return annualRanking.find((r) => r.studentId === effectiveStudentId);
  }, [annualRanking, effectiveStudentId]);

  // Averages in each category
  const count = studentEntries.length || 1;
  const avgPontualidade = (studentEntries.reduce((acc, c) => acc + (c.pontualidade ?? 10), 0) / count).toFixed(1);
  const avgComportamento = (studentEntries.reduce((acc, c) => acc + (c.comportamento ?? 10), 0) / count).toFixed(1);
  const avgPresenca = (studentEntries.reduce((acc, c) => acc + (c.presenca ?? 10), 0) / count).toFixed(1);
  const avgParticipacao = (studentEntries.reduce((acc, c) => acc + (c.participacao ?? 10), 0) / count).toFixed(1);
  const avgAtividade = (studentEntries.reduce((acc, c) => acc + (c.atividade ?? 10), 0) / count).toFixed(1);

  // If student record has not been matched or resolved, show explicit info rather than wrong student
  if (!effectiveStudentId || !activeStudent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/30">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white font-['Teko',sans-serif] tracking-wider uppercase">
          Vínculo de Cadastro em Andamento
        </h2>
        <p className="text-sm text-blue-200/80">
          Olá, <strong>{userProfile?.name || 'Valente'}</strong>! Sua conta autenticada está ativa, mas seu perfil ainda está aguardando a vinculação ao cadastro oficial de alunos.
        </p>
        <p className="text-xs text-slate-400">
          O Administrador Principal ({'lucasj6k@gmail.com'}) pode vincular sua conta no painel de administração para liberar seus registros históricos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-12 space-y-5">
      {/* Live update alert banner for student */}
      {recentStudentUpdate && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-blue-950/80 to-emerald-950/80 border-2 border-emerald-400/80 text-white flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span className="text-emerald-400 font-extrabold uppercase text-[10px] tracking-wider bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/30">
                  Nota Recém-Atualizada
                </span>
                <span>{recentStudentUpdate.teacherName || 'O Professor'} registrou sua pontuação!</span>
              </p>
              <p className="text-xs text-blue-200/80">
                Total atribuído: <strong className="text-amber-300 font-black">{recentStudentUpdate.total} pts</strong>.
                Seus rankings semanais e mensais já foram atualizados automaticamente.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-400/20 text-emerald-300 text-xs font-black uppercase flex-shrink-0">
            +{recentStudentUpdate.total} pts
          </span>
        </div>
      )}

      {/* Student Welcome Header (Strictly locked to authenticated student) */}
      <div className="bg-[#0B192C] border-2 border-amber-400/40 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-lg shadow-amber-500/25">
              {activeStudent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Painel do Valente
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-blue-300 font-medium">Acesso Individual</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none">
                Olá, {activeStudent.name}!
              </h2>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Aqui você acompanha suas notas e colocações nos rankings oficiais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-2 rounded-xl bg-blue-900/50 border border-blue-800 text-blue-200 text-xs font-semibold flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Conta Oficial: {activeStudent.name}</span>
            </div>
          </div>
        </div>

        {/* 3 Main Ranking Highlights: Semanal, Mensal, Anual */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-blue-900/60">
          {/* 1. Semanal */}
          <div
            onClick={() => setActiveTab('semanal')}
            className="p-3.5 rounded-2xl bg-[#060D17] border border-blue-900/80 hover:border-amber-400/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                <span>Esta Semana</span>
              </span>
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-['Teko',sans-serif] leading-none">
                {myWeeklyRank ? `${myWeeklyRank.position}º Lugar` : 'Sem nota'}
              </span>
              {myWeeklyRank && (
                <span className="text-xs font-bold text-amber-400">
                  ({myWeeklyRank.totalPoints} pts)
                </span>
              )}
            </div>
          </div>

          {/* 2. Mensal */}
          <div
            onClick={() => setActiveTab('mensal')}
            className="p-3.5 rounded-2xl bg-[#060D17] border border-blue-900/80 hover:border-amber-400/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-blue-400" />
                <span>Este Mês</span>
              </span>
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-['Teko',sans-serif] leading-none">
                {myMonthlyRank ? `${myMonthlyRank.position}º Lugar` : 'Sem nota'}
              </span>
              {myMonthlyRank && (
                <span className="text-xs font-bold text-amber-400">
                  ({myMonthlyRank.totalPoints} pts)
                </span>
              )}
            </div>
          </div>

          {/* 3. Anual Geral */}
          <div
            onClick={() => setActiveTab('anual')}
            className="p-3.5 rounded-2xl bg-[#060D17] border border-blue-900/80 hover:border-amber-400/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Geral do Ano</span>
              </span>
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-300 font-['Teko',sans-serif] leading-none">
                {myAnnualRank ? `${myAnnualRank.position}º Lugar` : 'Sem nota'}
              </span>
              {myAnnualRank && (
                <span className="text-xs font-bold text-amber-400">
                  ({totalPoints} pts)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Averages Grid */}
      <div className="bg-[#0B192C] rounded-3xl p-4 sm:p-5 border border-blue-900/60 shadow-xl space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Suas Médias por Critério (Escala 0 a 10)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#060D17] border border-blue-900/60 text-center">
            <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Pontualidade</span>
            <span className="text-2xl font-black text-white font-['Teko',sans-serif]">{avgPontualidade}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#060D17] border border-blue-900/60 text-center">
            <HeartHandshake className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Comportamento</span>
            <span className="text-2xl font-black text-white font-['Teko',sans-serif]">{avgComportamento}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#060D17] border border-blue-900/60 text-center">
            <UserCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Presença</span>
            <span className="text-2xl font-black text-white font-['Teko',sans-serif]">{avgPresenca}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#060D17] border border-blue-900/60 text-center">
            <Award className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Participação</span>
            <span className="text-2xl font-black text-white font-['Teko',sans-serif]">{avgParticipacao}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#060D17] border border-blue-900/60 text-center col-span-2 sm:col-span-1">
            <BookOpen className="w-4 h-4 text-rose-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Atividade</span>
            <span className="text-2xl font-black text-white font-['Teko',sans-serif]">{avgAtividade}</span>
          </div>
        </div>
      </div>

      {/* History of Score Entries (Strictly for this student) */}
      <div className="bg-[#0B192C] rounded-3xl p-4 sm:p-6 border border-blue-900/60 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-black text-white font-['Teko',sans-serif] tracking-wider uppercase">
              Histórico de Lançamentos de {activeStudent.name}
            </h3>
          </div>
          <span className="text-xs text-blue-300 font-bold bg-blue-950 px-2.5 py-1 rounded-xl border border-blue-800">
            {studentEntries.length} {studentEntries.length === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>

        {studentEntries.length === 0 ? (
          <div className="p-8 text-center bg-[#060D17] rounded-2xl border border-blue-950 text-slate-400 text-xs">
            Nenhuma pontuação registrada para o seu cadastro até o momento.
          </div>
        ) : (
          <div className="divide-y divide-blue-900/40 max-h-96 overflow-y-auto scrollbar-thin pr-1">
            {studentEntries.map((entry) => (
              <div key={entry.id} className="py-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {entry.categoryName || 'Geral'}
                    </span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] text-blue-300">
                      {formatDateBR(entry.date)}
                    </span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] text-amber-400/90 font-medium">
                      {entry.teacherName}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-slate-300 italic truncate max-w-md">
                      "{entry.notes}"
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xl font-black text-amber-400 font-['Teko',sans-serif]">
                    +{entry.points !== undefined ? entry.points : (entry as any).total || 0} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
