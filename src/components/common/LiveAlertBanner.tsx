import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LionBadge, ChampionCrown } from './BrandAssets';
import {
  BellRing,
  X,
  Volume2,
  VolumeX,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';

export const LiveAlertBanner: React.FC = () => {
  const {
    liveAlert,
    clearLiveAlert,
    setActiveTab,
    activeStudentId,
    setActiveStudentId,
    students
  } = useApp();
  const { role } = useAuth();

  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!liveAlert) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const duration = 8000; // 8 seconds display
    const intervalTime = 100;
    const decrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= decrement) {
          clearInterval(timer);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [liveAlert]);

  if (!liveAlert) return null;

  const isForCurrentStudent =
    role === 'student' &&
    liveAlert.studentName &&
    students.find((s) => s.id === activeStudentId)?.name === liveAlert.studentName;

  const handleActionClick = () => {
    if (liveAlert.studentName) {
      const student = students.find((s) => s.name === liveAlert.studentName);
      if (student) {
        setActiveStudentId(student.id);
      }
    }
    if (role === 'student') {
      setActiveTab('minhas-notas');
    } else {
      setActiveTab('semanal');
    }
    clearLiveAlert();
  };

  return (
    <aside
      aria-label="Notificação em tempo real"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-200"
    >
      <div
        className={`rounded-2xl border-2 p-3.5 shadow-2xl backdrop-blur-xl transition-all relative overflow-hidden ${
          isForCurrentStudent
            ? 'bg-gradient-to-br from-[#0F223D] to-[#162F52] border-amber-400 shadow-amber-400/30'
            : 'bg-[#0B192C]/98 border-blue-500/80 shadow-blue-500/20'
        }`}
      >
        {/* Animated background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header: Live Pill & Close */}
        <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-amber-400" />
              <span>AO VIVO · NOTA ATUALIZADA</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-blue-300/70 font-semibold">Agora mesmo</span>
            <button
              onClick={clearLiveAlert}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
              title="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Body */}
        <div className="flex items-start gap-3 relative z-10">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-slate-950 flex-shrink-0 shadow-md ${
              isForCurrentStudent
                ? 'bg-gradient-to-tr from-amber-300 to-amber-500'
                : 'bg-gradient-to-tr from-blue-400 to-amber-400'
            }`}
          >
            {isForCurrentStudent ? (
              <ChampionCrown className="w-6 h-6" />
            ) : (
              <LionBadge className="w-7 h-7" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-100 font-bold leading-snug">
              <span className="text-white font-extrabold">{liveAlert.teacherName || 'Professor'}</span>{' '}
              {liveAlert.type === 'score_updated' ? 'atualizou a pontuação de' : 'lançou a pontuação de'}{' '}
              <span className="text-amber-300 font-black underline underline-offset-2">
                {liveAlert.studentName || 'um aluno'}
              </span>
              !
            </p>

            {/* Score pill */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {liveAlert.total !== undefined && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-black font-['Teko',sans-serif] tracking-wide uppercase shadow-sm">
                  {liveAlert.total} PONTOS
                </span>
              )}

              {liveAlert.scores && (
                <div className="flex items-center gap-1 text-[9px] text-blue-200/90 font-bold">
                  <span title="Pontualidade">P: {liveAlert.scores.pontualidade}</span>
                  <span>·</span>
                  <span title="Comportamento">C: {liveAlert.scores.comportamento}</span>
                  <span>·</span>
                  <span title="Presença">Pr: {liveAlert.scores.presenca}</span>
                  <span>·</span>
                  <span title="Participação">Pa: {liveAlert.scores.participacao}</span>
                  <span>·</span>
                  <span title="Atividade">At: {liveAlert.scores.atividade}</span>
                </div>
              )}
            </div>

            {isForCurrentStudent && (
              <p className="text-[10px] text-emerald-300 font-bold mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Esta nota é sua! Seu ranking foi atualizado.</span>
              </p>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="mt-2.5 pt-2 border-t border-blue-900/60 flex items-center justify-between gap-2 relative z-10">
          <span className="text-[10px] text-slate-400 truncate">
            Rankings recalculados automaticamente
          </span>

          <button
            onClick={handleActionClick}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-wider shadow active:scale-95 transition-all flex-shrink-0 cursor-pointer"
          >
            <span>{isForCurrentStudent ? 'Ver Minha Nota' : 'Ver no Ranking'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Auto-dismiss progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-950/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
