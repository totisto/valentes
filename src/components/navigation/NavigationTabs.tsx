import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  PlusCircle,
  Layers,
  History,
  CalendarDays,
  CalendarRange,
  Trophy,
  ShieldAlert,
  UserCheck,
  Mail
} from 'lucide-react';

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const { role, isAdmin } = useAuth();

  let tabs: { id: ActiveTab; label: string; icon: React.ReactNode; isPrimary?: boolean }[] = [];

  if (role === 'student') {
    // Aluno: Acesso restrito aos Rankings e Minhas Notas
    tabs = [
      {
        id: 'dashboard',
        label: 'Início',
        icon: <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        id: 'semanal',
        label: 'Semanal',
        icon: <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        id: 'minhas-notas',
        label: 'Minhas Notas',
        icon: <UserCheck className="w-5 h-5 sm:w-5 sm:h-5" />,
        isPrimary: true,
      },
      {
        id: 'mensal',
        label: 'Mensal',
        icon: <CalendarRange className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        id: 'anual',
        label: 'Anual',
        icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        id: 'gmail',
        label: 'Gmail',
        icon: <Mail className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
    ];
  } else {
    // Professor / Admin: Acesso aos lançamentos e histórico
    tabs = [
      {
        id: 'dashboard',
        label: 'Início',
        icon: <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        id: 'lancamento',
        label: 'Lançar',
        icon: <PlusCircle className="w-5 h-5 sm:w-5 sm:h-5" />,
        isPrimary: true,
      },
      {
        id: 'lancamento-rapido',
        label: 'Rápido',
        icon: <Layers className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        id: 'semanal',
        label: 'Semanal',
        icon: <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        id: 'mensal',
        label: 'Mensal',
        icon: <CalendarRange className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        id: 'anual',
        label: 'Anual',
        icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        id: 'historico',
        label: 'Histórico',
        icon: <History className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        id: 'gmail',
        label: 'Gmail',
        icon: <Mail className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
    ];

    if (isAdmin) {
      tabs.push({
        id: 'admin',
        label: 'Admin',
        icon: <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />,
      });
    }
  }

  return (
    <>
      {/* Desktop / Tablet Bar */}
      <div className="hidden md:block bg-[#081220] border-b border-blue-900/40 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 overflow-x-auto py-1.5 scrollbar-none">
          <div className="flex items-center gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              if (tab.isPrimary) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-amber-500/20 ring-2 ring-white'
                        : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-900/60 text-amber-300 border border-blue-700/60 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-blue-950/40'
                  }`}
                >
                  <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-blue-300/70 font-medium px-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{role === 'student' ? 'Portal do Aluno · 21 Valentes' : 'Firebase Cloud Conectado'}</span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B192C]/95 backdrop-blur-lg border-t border-blue-900/50 px-2 py-1 pb-safe">
        <div className="grid grid-flow-col auto-cols-fr items-center justify-around gap-0.5 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            if (tab.isPrimary) {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-col items-center justify-center -mt-4 group focus:outline-none cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-amber-500/40 ring-2 ring-white'
                        : 'bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-amber-500/30'
                    }`}
                  >
                    {tab.icon}
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 font-bold tracking-tight ${
                      isActive ? 'text-amber-400' : 'text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-colors cursor-pointer ${
                  isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  {tab.icon}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </div>
                <span className="text-[10px] font-semibold mt-1 tracking-tight truncate max-w-[50px]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
