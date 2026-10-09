import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LionBadge, ChampionCrown } from '../common/BrandAssets';
import {
  X,
  Bell,
  Clock,
  Volume2,
  VolumeX,
  Trash2,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notificationsList,
    setActiveTab,
    setActiveStudentId,
    students,
    isOnline
  } = useApp();
  const { role } = useAuth();
  const serverOnline = isOnline;
  const userRole = role === 'student' ? 'aluno' : 'professor';

  if (!isOpen) return null;

  const handleNotificationClick = (studentName?: string) => {
    if (studentName) {
      const student = students.find((s) => s.name === studentName);
      if (student) {
        setActiveStudentId(student.id);
      }
    }
    if (userRole === 'aluno') {
      setActiveTab('minhas-notas');
    } else {
      setActiveTab('semanal');
    }
    onClose();
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSeconds < 60) return 'Agora mesmo';
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) return `Há ${diffMinutes} min`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Há ${diffHours} h`;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0B192C] border-2 border-blue-800 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-blue-900/60 flex items-center justify-between gap-3 bg-[#081220]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-blue-600 p-0.5 shadow-md">
              <div className="w-full h-full bg-[#0B192C] rounded-[14px] flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black uppercase tracking-wider text-white font-['Teko',sans-serif] leading-none">
                  Central de Notificações
                </h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <p className="text-[11px] text-blue-300/80">
                Atualizações instantâneas de notas e rankings em tempo real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-blue-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Status banner */}
        <div className="px-4 py-2.5 bg-blue-950/60 border-b border-blue-900/40 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-300 font-semibold">
              {serverOnline
                ? 'Conexão em Tempo Real Ativa (SSE)'
                : 'Tentando reconectar...'}
            </span>
          </div>
          <span className="text-amber-400 font-bold">
            {notificationsList.length} registro(s)
          </span>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-blue-900/40 space-y-2">
          {notificationsList.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-900 flex items-center justify-center mx-auto text-blue-400">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Nenhuma atualização recente</p>
                <p className="text-xs text-blue-300/70 max-w-xs mx-auto mt-1">
                  Assim que um professor registrar ou alterar a pontuação de qualquer aluno, a notificação aparecerá aqui automaticamente para todos.
                </p>
              </div>
            </div>
          ) : (
            notificationsList.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif.studentName)}
                className="py-3 px-3 rounded-2xl hover:bg-blue-950/50 cursor-pointer transition-colors group flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <LionBadge className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      {notif.teacherName || 'Professor'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(notif.timestamp)}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-snug">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5">
                    {notif.total !== undefined && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                        {notif.total} pts
                      </span>
                    )}
                    <span className="text-[10px] text-blue-300 font-semibold group-hover:underline flex items-center gap-1">
                      <span>Ver detalhes</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-[#081220] border-t border-blue-900/60 flex items-center justify-between text-xs">
          <div className="text-[11px] text-blue-300/70 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sincronização instantânea na nuvem</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
