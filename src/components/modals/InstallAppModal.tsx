import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share, PlusSquare, CheckCircle2, ShieldCheck } from 'lucide-react';
import { LionBadge, ChampionCrown } from '../common/BrandAssets';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Detect if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture beforeinstallprompt for Android & Chrome
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B192C] border-2 border-amber-400 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LionBadge className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Aplicativo Oficial
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-blue-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-blue-700 p-0.5 mx-auto mb-2 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#0B192C] rounded-[14px] flex items-center justify-center">
              <LionBadge className="w-9 h-9" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none">
            Baixar o App dos Valentes
          </h3>
          <p className="text-xs text-blue-200/80 mt-1">
            Instale no celular para professores lançarem notas e alunos consultarem seus rankings a qualquer momento.
          </p>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">Aplicativo Já Instalado!</p>
            <p className="text-xs text-emerald-300/80">
              Você já está utilizando o aplicativo instalado no seu aparelho.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Native Android / Desktop prompt button */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Instalar Agora no Aparelho</span>
              </button>
            )}

            {/* iOS Instructions */}
            {isIOS ? (
              <div className="p-3.5 rounded-2xl bg-[#060D17] border border-blue-900/60 space-y-2.5 text-xs">
                <span className="font-bold text-amber-400 block uppercase text-[10px] tracking-wider">
                  Como instalar no iPhone (Safari):
                </span>
                <div className="flex items-start gap-2.5 text-slate-200">
                  <div className="p-1 rounded-lg bg-blue-900/60 text-blue-300">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <strong>1.</strong> Toque no botão <strong>Compartilhar</strong> na barra do Safari (ícone de quadrado com seta).
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-slate-200">
                  <div className="p-1 rounded-lg bg-blue-900/60 text-blue-300">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong>2.</strong> Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#060D17] border border-blue-900/60 space-y-2.5 text-xs">
                <span className="font-bold text-amber-400 block uppercase text-[10px] tracking-wider">
                  Como instalar no Android / Chrome:
                </span>
                <p className="text-slate-300">
                  Toque nos <strong>três pontinhos (⋮)</strong> do navegador no topo e clique em{' '}
                  <strong className="text-white">"Instalar aplicativo"</strong> ou{' '}
                  <strong className="text-white">"Adicionar à tela inicial"</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-900/40 text-[11px] text-blue-200/80 space-y-1">
          <p className="font-bold text-white flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacidade & Regras de Acesso:</span>
          </p>
          <p>
            • <strong>Alunos</strong>: visualizam apenas o Ranking e suas próprias notas (não podem lançar notas).
          </p>
          <p>
            • <strong>Professores</strong>: lançam e gerenciam as notas diárias com cálculo automático.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
