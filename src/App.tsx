/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/navigation/Header';
import { NavigationTabs } from './components/navigation/NavigationTabs';
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { ScoreEntryView } from './components/views/ScoreEntryView';
import { QuickScoreEntryView } from './components/views/QuickScoreEntryView';
import { HistoryView } from './components/views/HistoryView';
import { WeeklyRankingView } from './components/views/WeeklyRankingView';
import { MonthlyRankingView } from './components/views/MonthlyRankingView';
import { AnnualRankingView } from './components/views/AnnualRankingView';
import { StudentMyScoresView } from './components/views/StudentMyScoresView';
import { AdminView } from './components/views/AdminView';
import { LiveAlertBanner } from './components/common/LiveAlertBanner';
import { QuickUpdateScoreModal } from './components/modals/QuickUpdateScoreModal';

function AppContent() {
  const { role, currentUser, userProfile, isAdmin, isLoading } = useAuth();
  const {
    activeTab,
    isScoreUpdateModalOpen,
    closeScoreUpdateModal,
    targetUpdateStudentId
  } = useApp();

  // 1 & 2. While Firebase verifies persisted session and resolves profile, display loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060D17] text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 p-1 shadow-2xl shadow-amber-500/20 mb-4 animate-pulse">
          <div className="w-full h-full bg-[#0B192C] rounded-[20px] flex items-center justify-center text-amber-400 font-bold text-2xl">
            🦁
          </div>
        </div>
        <p className="text-sm font-bold text-slate-300 uppercase tracking-widest font-['Teko',sans-serif] text-xl">
          Ranking dos Valentes
        </p>
        <p className="text-xs text-blue-300/70 mt-1">Carregando sessão segura...</p>
      </div>
    );
  }

  // 7. If no valid session exists, show LoginView
  const isAuthenticated = !!currentUser && !!userProfile;
  if (!isAuthenticated) {
    return (
      <>
        <LiveAlertBanner />
        <LoginView />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#060D17] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Floating Realtime Notification Banner */}
      <LiveAlertBanner />

      {/* Top Header */}
      <Header />

      {/* Desktop & Mobile Navigation */}
      <NavigationTabs />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'lancamento' && (role !== 'student' ? <ScoreEntryView /> : <StudentMyScoresView />)}
        {activeTab === 'lancamento-rapido' && (role !== 'student' ? <QuickScoreEntryView /> : <StudentMyScoresView />)}
        {activeTab === 'historico' && (role !== 'student' ? <HistoryView /> : <StudentMyScoresView />)}
        {activeTab === 'semanal' && <WeeklyRankingView />}
        {activeTab === 'mensal' && <MonthlyRankingView />}
        {activeTab === 'anual' && <AnnualRankingView />}
        {activeTab === 'minhas-notas' && <StudentMyScoresView />}
        {activeTab === 'admin' && (isAdmin ? <AdminView /> : <DashboardView />)}
      </main>

      {/* Global Quick Score Update Modal for Teachers/Admin */}
      {role !== 'student' && (
        <QuickUpdateScoreModal
          isOpen={isScoreUpdateModalOpen}
          onClose={closeScoreUpdateModal}
          initialStudentId={targetUpdateStudentId}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
