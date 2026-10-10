import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LionBadge, ChampionCrown } from '../common/BrandAssets';
import {
  Clock,
  ShieldAlert,
  RotateCw,
  LogOut,
  Mail,
  User,
  KeyRound,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const StudentPendingLinkView: React.FC = () => {
  const { currentUser, userProfile, refreshUserProfile, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsChecking(true);
    setFeedback(null);
    try {
      const refreshed = await refreshUserProfile();
      if (refreshed?.studentId) {
        setFeedback('Vínculo confirmado! Carregando suas notas...');
        window.location.reload();
      } else {
        setFeedback('Vínculo ainda pendente. O administrador ainda não associou seu cadastro.');
      }
    } catch {
      setFeedback('Erro ao consultar o servidor. Tente novamente em instantes.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="relative inline-block">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 p-0.5 shadow-xl shadow-amber-500/20 mx-auto flex items-center justify-center">
            <div className="w-full h-full bg-[#0B192C] rounded-[22px] flex items-center justify-center">
              <LionBadge className="w-10 h-10" />
            </div>
          </div>
          <div className="absolute -top-1 -right-1">
            <ChampionCrown className="w-5 h-5 drop-shadow" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Teko',sans-serif] tracking-wider uppercase leading-none">
          Ranking dos Valentes
        </h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          <span>Vínculo de Cadastro Pendente</span>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="w-full bg-[#0B192C] border-2 border-amber-400/50 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase">
            Olá, {userProfile?.name || currentUser?.displayName || 'Valente'}!
          </h2>
          <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
            Sua conta de autenticação foi criada e está <strong>100% ativa</strong> no sistema.
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Para garantir a segurança dos seus pontos e impedir que outro usuário acesse suas informações, o vínculo entre seu e-mail e seu cadastro canônico nos <strong>21 alunos oficiais</strong> é realizado com validação de segurança.
          </p>
        </div>

        {/* User identification info */}
        <div className="bg-[#060D17] border border-blue-900/60 rounded-2xl p-4 space-y-2 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
            Dados da Sua Conta Autenticada:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="truncate"><strong>Nome:</strong> {userProfile?.name || currentUser?.displayName || 'Aluno'}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="truncate font-mono"><strong>E-mail:</strong> {currentUser?.email || 'N/A'}</span>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 truncate">
              <KeyRound className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="text-[11px] text-slate-400 font-mono truncate">
                <strong>UID Oficial:</strong> {currentUser?.uid}
              </span>
            </div>
          </div>
        </div>

        {/* Admin notice */}
        <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-blue-200 text-xs space-y-1">
          <p className="font-semibold text-white">O que acontece agora?</p>
          <p className="text-blue-300/80">
            O Administrador Principal (<strong className="text-amber-300">lucasj6k@gmail.com</strong>) associa sua conta ao seu histórico oficial no painel de administração. Assim que o vínculo for confirmado, todo o seu histórico de notas e colocações nos rankings semanal, mensal e anual será exibido automaticamente.
          </p>
        </div>

        {feedback && (
          <div className="p-3 rounded-xl bg-blue-900/40 border border-blue-700/50 text-blue-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isChecking}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Verificando...' : 'Verificar Vínculo Agora'}</span>
          </button>

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
