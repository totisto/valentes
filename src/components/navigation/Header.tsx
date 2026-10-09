import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LionBadge, ChampionCrown } from '../common/BrandAssets';
import {
  Download,
  LogOut,
  Bell,
  RotateCw,
  Zap
} from 'lucide-react';
import { InstallAppModal } from '../modals/InstallAppModal';
import { NotificationsModal } from '../modals/NotificationsModal';

interface HeaderProps {
  onOpenAdminAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const {
    activeStudent,
    activeTeacher,
    activeTab,
    setActiveTab,
    notificationsList,
    liveAlert,
    isOnline,
    syncNow,
    isSyncing,
    openScoreUpdateModal
  } = useApp();

  const { userProfile, role, isAdmin, logout } = useAuth();

  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0B192C]/95 backdrop-blur-md border-b border-blue-900/40 px-3 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand / Logo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-blue-700 p-0.5 shadow-lg shadow-amber-500/10">
                <div className="w-full h-full bg-[#0B192C] rounded-[10px] flex items-center justify-center">
                  <LionBadge className="w-7 h-7" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1">
                <ChampionCrown className="w-4 h-4 drop-shadow" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1
                  onClick={() => setActiveTab('dashboard')}
                  className="text-base sm:text-lg font-black tracking-wider uppercase text-white font-['Teko',sans-serif] leading-tight cursor-pointer"
                >
                  VALENTES
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-400/30 px-1 py-0.2 rounded bg-amber-400/10">
                  {role === 'student' ? 'Aluno' : isAdmin ? 'Admin' : 'Professor'}
                </span>
                <span
                  title={isOnline ? "Conectado ao Cloud Firestore (Sincronização em Tempo Real)" : "Modo Offline"}
                  className="hidden md:inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {isOnline ? 'Firestore Ativo' : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium truncate">
                {role === 'student'
                  ? `Notas e Rankings de ${activeStudent?.name || 'Valente'}`
                  : `${userProfile?.name || 'Professor'} · Temporada Oficial`}
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Sync Now button */}
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="p-2 rounded-xl bg-blue-950/90 border border-blue-800/80 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-all active:scale-95 cursor-pointer"
              title="Sincronizar dados em tempo real com o Firestore"
            >
              <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Quick Score Update Button for Teachers & Admin */}
            {role !== 'student' && (
              <button
                onClick={() => openScoreUpdateModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                title="Lançar ou atualizar pontos de um aluno agora"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 stroke-[2.5]" />
                <span className="hidden sm:inline">Atualizar Pontos</span>
                <span className="sm:hidden">Pontos</span>
              </button>
            )}

            {/* Real-time Notifications Bell Button */}
            <button
              onClick={() => setShowNotificationsModal(true)}
              className="relative p-2 rounded-xl bg-blue-950/90 border border-blue-800/80 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-all active:scale-95 cursor-pointer"
              title="Central de Atualizações em Tempo Real"
            >
              <Bell className="w-4 h-4" />
              {notificationsList.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-md">
                  {notificationsList.length > 9 ? '9+' : notificationsList.length}
                </span>
              )}
              {liveAlert && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {/* Install / Download App Button */}
            <button
              onClick={() => setShowInstallModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-950/90 border border-blue-800/80 hover:border-amber-400 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Baixar e Instalar o App no Celular (PWA)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Baixar App</span>
            </button>

            {/* User Profile Badge (Read-only, strictly identified by session) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-950/90 border border-blue-800/80 text-white text-xs font-semibold shadow-sm">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold uppercase flex-shrink-0 ${
                  role === 'student' ? 'bg-amber-400 text-slate-950' : 'bg-blue-600 text-white'
                }`}
              >
                {((role === 'student' ? activeStudent?.name : userProfile?.name) || 'U').charAt(0)}
              </div>
              <span className="max-w-[85px] sm:max-w-[130px] truncate text-slate-100">
                {role === 'student' ? activeStudent?.name || 'Aluno' : userProfile?.name || 'Professor'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500 hover:text-rose-400 text-slate-400 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Sair da Conta"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />
    </>
  );
};
