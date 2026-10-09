import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Lock, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { LionBadge } from '../common/BrandAssets';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose }) => {
  const { isAdmin, currentUser } = useAuth();
  const { setActiveTab } = useApp();

  if (!isOpen) return null;

  const handleAccessAdmin = () => {
    if (isAdmin) {
      setActiveTab('admin');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B192C] border-2 border-amber-400 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LionBadge className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Controle de Acesso
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-blue-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase">
            Área da Administração
          </h3>
          <p className="text-xs text-blue-200/80 mt-1">
            O painel de coordenação é restrito ao Administrador Principal autorizado (<strong className="text-amber-400">lucasj6k@gmail.com</strong>).
          </p>
        </div>

        {isAdmin ? (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>Sua conta possui autorização de Administrador Principal.</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAccessAdmin}
                className="flex-1 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black uppercase text-xs tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Acessar Painel Admin
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>
                Usuário atual ({currentUser?.email || 'Não autenticado'}) não possui privilégios de administrador.
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
