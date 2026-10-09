import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { LionBadge, ChampionCrown, BrushStroke } from '../common/BrandAssets';
import { InstallAppModal } from '../modals/InstallAppModal';
import {
  Lock,
  Mail,
  KeyRound,
  GraduationCap,
  Users,
  Download,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  UserPlus,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const {
    loginWithEmail,
    loginWithGoogle,
    registerStudentAccount,
    resetPassword,
    authError,
    clearAuthError,
    defaultDashboardTab
  } = useAuth();
  const { setActiveTab } = useApp();

  // Mode: Student vs Teacher/Admin
  const [accessMode, setAccessMode] = useState<'student' | 'teacher'>('student');

  // Student Sub-mode: 'login' | 'register'
  const [studentSubMode, setStudentSubMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [formError, setFormError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModeSwitch = (mode: 'student' | 'teacher') => {
    setAccessMode(mode);
    clearAuthError();
    setFormError(null);
    setIsResetting(false);
    setResetSentEmail(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setFormError(null);
    setIsSubmitting(true);

    // Password reset flow
    if (isResetting) {
      if (!email.trim()) {
        setFormError('Informe seu e-mail para receber o link.');
        setIsSubmitting(false);
        return;
      }
      const success = await resetPassword(email);
      if (success) {
        setResetSentEmail(email);
      }
      setIsSubmitting(false);
      return;
    }

    // Student Registration Flow
    if (accessMode === 'student' && studentSubMode === 'register') {
      if (!name.trim()) {
        setFormError('Por favor, informe seu nome completo.');
        setIsSubmitting(false);
        return;
      }
      if (!email.trim()) {
        setFormError('Por favor, informe um e-mail válido.');
        setIsSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setFormError('A senha deve ter pelo menos 6 caracteres.');
        setIsSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        setFormError('As senhas digitadas não coincidem.');
        setIsSubmitting(false);
        return;
      }

      const success = await registerStudentAccount(name, email, password);
      if (success) {
        setActiveTab('minhas-notas');
      }
      setIsSubmitting(false);
      return;
    }

    // Standard Email/Password Login (Both for Student and Teacher)
    if (!email.trim() || !password) {
      setFormError('Informe e-mail e senha.');
      setIsSubmitting(false);
      return;
    }

    const success = await loginWithEmail(email, password);
    if (success) {
      setActiveTab(defaultDashboardTab);
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    const success = await loginWithGoogle();
    if (success) {
      setActiveTab(defaultDashboardTab);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#060D17] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Dynamic Glows */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top action button: Baixar App */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowInstallModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 text-amber-300 text-xs font-bold transition-all active:scale-95 shadow-md"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar App no Celular</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-block mb-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-blue-700 p-1 shadow-2xl shadow-amber-500/25 ring-4 ring-amber-400/20 mx-auto">
              <div className="w-full h-full bg-[#0B192C] rounded-[20px] flex items-center justify-center">
                <LionBadge className="w-12 h-12" />
              </div>
            </div>
            <div className="absolute -top-2 -right-1">
              <ChampionCrown className="w-6 h-6 drop-shadow-lg" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white font-['Teko',sans-serif] tracking-wider uppercase leading-none">
            Ranking dos Valentes
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/80 font-medium">
            Liderança · Propósito · Honra
          </p>
          <div className="flex justify-center pt-0.5">
            <BrushStroke className="w-28 h-2.5" color="#FACC15" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#0B192C]/95 border-2 border-blue-900/80 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
          {/* Main Role Selector */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 text-center">
              QUEM É VOCÊ?
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#060D17] border border-blue-950">
              <button
                type="button"
                onClick={() => handleModeSwitch('student')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  accessMode === 'student'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-300'
                    : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
                }`}
              >
                <span>👨‍🎓 SOU ALUNO</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeSwitch('teacher')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  accessMode === 'teacher'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
                }`}
              >
                <span>👨‍🏫 PROFESSOR / ADMIN</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation for Student: Login vs Criar Conta */}
          {accessMode === 'student' && !isResetting && (
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#081220] border border-blue-900/60 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStudentSubMode('login');
                  setFormError(null);
                }}
                className={`py-2 px-3 rounded-lg font-bold transition-all ${
                  studentSubMode === 'login'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fazer Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudentSubMode('register');
                  setFormError(null);
                }}
                className={`py-2 px-3 rounded-lg font-bold transition-all ${
                  studentSubMode === 'register'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Criar Minha Conta
              </button>
            </div>
          )}

          {/* Notice for Teacher Section */}
          {accessMode === 'teacher' && (
            <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-800/60 flex items-start gap-2.5 text-xs text-blue-200">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Acesso dos Professores & Coordenação</span>
                <span className="text-[11px] text-blue-300/80">
                  Entre com suas credenciais oficiais ou com a sua conta Google autorizada.
                </span>
              </div>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Registration: Full Name */}
            {accessMode === 'student' && studentSubMode === 'register' && !isResetting && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                  Nome Completo do Aluno:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Beatriz Lima"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {accessMode === 'student' ? 'Seu E-mail:' : 'E-mail do Professor ou Admin:'}
                </span>
              </label>
              <input
                type="email"
                placeholder={accessMode === 'student' ? 'aluno@email.com' : 'lucasj6k@gmail.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            {/* Password Input */}
            {!isResetting && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Senha:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsResetting(true)}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={
                      accessMode === 'student' && studentSubMode === 'register'
                        ? 'Mínimo de 6 caracteres'
                        : 'Digite sua senha'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#060D17] border border-blue-800 rounded-xl pl-3 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (only on student register) */}
            {accessMode === 'student' && studentSubMode === 'register' && !isResetting && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Confirmar Senha:</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            )}

            {/* Reset Sent Confirmation */}
            {resetSentEmail && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>E-mail de recuperação enviado para {resetSentEmail}!</span>
              </div>
            )}

            {/* Auth / Form Errors */}
            {(authError || formError) && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError || formError}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                accessMode === 'student'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-400 text-white shadow-blue-600/30'
              }`}
            >
              <span>
                {isResetting
                  ? 'Enviar Link de Recuperação'
                  : accessMode === 'student' && studentSubMode === 'register'
                  ? 'CRIAR MINHA CONTA'
                  : 'ENTRAR NO SISTEMA'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary Actions */}
            {isResetting ? (
              <button
                type="button"
                onClick={() => setIsResetting(false)}
                className="w-full text-center text-xs text-slate-400 hover:text-white underline pt-1"
              >
                Voltar para o login
              </button>
            ) : accessMode === 'student' ? (
              <div className="pt-2 text-center">
                {studentSubMode === 'login' ? (
                  <p className="text-xs text-slate-400">
                    Ainda não tem cadastro?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSubMode('register');
                        setFormError(null);
                      }}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      CRIAR MINHA CONTA
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Já possui conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSubMode('login');
                        setFormError(null);
                      }}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      Fazer login
                    </button>
                  </p>
                )}
              </div>
            ) : null}

            {/* Google Sign In option (Available for everyone) */}
            {!isResetting && (
              <div className="space-y-3 pt-2">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-blue-900/60 w-full" />
                  <span className="bg-[#0B192C] px-3 text-[11px] font-bold uppercase text-slate-500">
                    Ou entrar com
                  </span>
                  <div className="border-t border-blue-900/60 w-full" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar com Google</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-blue-300/50 space-y-1">
          <p>Ranking dos Valentes · Sistema de Avaliação e Honra</p>
          <p className="text-[10px] text-slate-500 font-mono">
            Sincronização em tempo real via Cloud Firestore
          </p>
        </div>
      </div>

      {/* PWA Install Modal */}
      <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </div>
  );
};
