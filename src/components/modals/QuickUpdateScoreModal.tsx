import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getTodayDateStr } from '../../utils/dateUtils';
import { LionBadge, ChampionCrown } from '../common/BrandAssets';
import {
  X,
  Zap,
  CheckCircle2,
  Calendar,
  User,
  Award,
  Sparkles,
  Plus,
  Minus,
  Layers,
  ArrowRight
} from 'lucide-react';

interface QuickUpdateScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string | null;
}

export const QuickUpdateScoreModal: React.FC<QuickUpdateScoreModalProps> = ({
  isOpen,
  onClose,
  initialStudentId
}) => {
  const {
    students,
    teachers,
    categories,
    activeTeacher,
    recordScore,
    entries
  } = useApp();
  const { userProfile } = useAuth();

  const [studentId, setStudentId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [points, setPoints] = useState<number>(10);
  const [date, setDate] = useState<string>(getTodayDateStr());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<{ studentName: string; pts: number } | null>(null);

  // Initialize selected values
  useEffect(() => {
    if (initialStudentId && students.some((s) => s.id === initialStudentId)) {
      setStudentId(initialStudentId);
    } else if (!studentId && students.length > 0) {
      setStudentId(students[0].id);
    }
  }, [initialStudentId, students]);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === studentId) || students[0];
  }, [students, studentId]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === categoryId) || categories[0];
  }, [categories, categoryId]);

  // Current total points of selected student
  const studentTotalPoints = useMemo(() => {
    if (!selectedStudent) return 0;
    return entries
      .filter((e) => e.studentId === selectedStudent.id)
      .reduce((sum, e) => sum + (e.points !== undefined ? e.points : ((e as any).total || 0)), 0);
  }, [entries, selectedStudent]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCategory) return;

    setIsSubmitting(true);
    setSuccessInfo(null);
    try {
      await recordScore({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        points: Math.max(0, points),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        date,
        notes
      });

      setSuccessInfo({
        studentName: selectedStudent.name,
        pts: points
      });

      // Reset notes
      setNotes('');

      // Auto close after 1.5 seconds if desired
      setTimeout(() => {
        setSuccessInfo(null);
        onClose();
      }, 1400);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0B192C] border-2 border-amber-400 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-blue-900/60">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/40">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Sincronização Central
              </span>
              <h3 className="text-xl font-black text-white font-['Teko',sans-serif] leading-none uppercase">
                Atualizar Pontos
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-blue-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successInfo && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-extrabold text-white text-sm">
                +{successInfo.pts} pontos salvos no banco central!
              </p>
              <p className="text-[11px] text-emerald-300">
                Atualizado instantaneamente para {successInfo.studentName} e todos os professores.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Student Select */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Aluno (21 Valentes):</span>
              </span>
              <span className="text-amber-400 font-extrabold">
                Atual: {studentTotalPoints} pts
              </span>
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-400 transition-colors"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Point Buttons & Input */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quantidade de Pontos a Adicionar:</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {[5, 10, 15, 20, 25].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPoints(val)}
                  className={`py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                    points === val
                      ? 'bg-amber-400 text-slate-950 font-black shadow ring-2 ring-white'
                      : 'bg-[#060D17] hover:bg-blue-900 border border-blue-800 text-slate-200'
                  }`}
                >
                  +{val}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPoints((p) => Math.max(0, p - 5))}
                className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 text-slate-200 hover:text-white flex items-center justify-center font-bold text-lg active:scale-95"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={points}
                onChange={(e) => setPoints(Math.max(0, Number(e.target.value) || 0))}
                className="flex-1 text-center bg-[#060D17] border border-blue-800 rounded-xl py-2 text-amber-300 font-black text-xl font-['Teko',sans-serif] tracking-wider focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setPoints((p) => p + 5)}
                className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 text-slate-200 hover:text-white flex items-center justify-center font-bold text-lg active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>Categoria / Critério:</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white font-semibold text-xs focus:outline-none focus:border-amber-400 transition-colors"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Authenticated Teacher */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">
                Data:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-2.5 py-1.5 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">
                Professor:
              </label>
              <div className="w-full bg-[#060D17]/60 border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-slate-300 text-xs truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span>{userProfile?.name || activeTeacher?.name || 'Professor'}</span>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">
              Observação (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Excelente participação no desafio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Gravando no Banco...' : 'Salvar no Banco Central'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
