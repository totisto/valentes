import React, { useState } from 'react';
import { X, Smartphone, Globe, Copy, Check, Share2, Shield, Lock } from 'lucide-react';
import { LionBadge } from '../common/BrandAssets';

interface AccessInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminAuth: () => void;
}

export const AccessInfoModal: React.FC<AccessInfoModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminAuth,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B192C] border-2 border-amber-400 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LionBadge className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Acesso & Instruções
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
          <h3 className="text-2xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none">
            Como Acessar e Usar o App
          </h3>
          <p className="text-xs text-blue-200/80 mt-1">
            O aplicativo funciona diretamente no celular de alunos e professores com sincronização oficial na nuvem.
          </p>
        </div>

        {/* Link direct copy */}
        <div className="bg-[#060D17] p-3 rounded-2xl border border-blue-900/60 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Link Direto de Acesso:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 bg-black/40 text-blue-200 text-xs px-2.5 py-2 rounded-xl border border-blue-950 truncate focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Access Guides */}
        <div className="space-y-3 text-xs">
          {/* 1. Alunos */}
          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-900/40 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>1. Acesso dos Alunos:</span>
            </div>
            <p className="text-slate-300 pl-5">
              Crie sua conta informando seu nome, e-mail e senha, ou acesse com sua conta Google. Seu cadastro será automaticamente conectado ao seu histórico de pontos.
            </p>
          </div>

          {/* 2. Professores e Coordenação */}
          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-900/40 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>2. Professores e Administrador:</span>
            </div>
            <p className="text-slate-300 pl-5">
              Professores entram com suas credenciais oficiais ou conta Google. O Administrador Principal autorizado (<strong className="text-amber-400">lucasj6k@gmail.com</strong>) gerencia turmas e usuários no painel de administração.
            </p>
          </div>

          {/* 3. Atalho na tela inicial do celular */}
          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-900/40 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>3. Colocar Ícone no Celular:</span>
            </div>
            <p className="text-slate-300 pl-5">
              No Safari (iPhone) ou Chrome (Android), toque no menu de compartilhar e escolha <strong>"Adicionar à Tela de Início"</strong>. Ele funcionará como um aplicativo nativo!
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              onClose();
              onOpenAdminAuth();
            }}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase cursor-pointer"
          >
            Painel Administrativo
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
