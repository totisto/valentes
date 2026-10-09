import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getTodayDateStr } from '../../utils/dateUtils';
import { LionBadge, ChampionCrown } from '../common/BrandAssets';
import {
  Layers,
  Calendar,
  CheckCircle2,
  Award,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Zap,
  Search
} from 'lucide-react';

export const QuickScoreEntryView: React.FC = () => {
  const { students, categories, teachers, activeTeacher, recordQuickScores, setActiveTab } = useApp();
  const { userProfile } = useAuth();

  const [date, setDate] = useState<string>(getTodayDateStr());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'cat-presenca');
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Map of studentId -> points to award
  const [studentPoints, setStudentPoints] = useState<Record<string, number>>({});

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || categories[0];
  }, [categories, selectedCategoryId]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    return students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase().trim()));
  }, [students, search]);

  const handleAdjustPoints = (studentId: string, delta: number) => {
    setStudentPoints((prev) => {
      const current = prev[studentId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [studentId]: next };
    });
    setSavedCount(null);
  };

  const handleSetPoints = (studentId: string, val: number) => {
    setStudentPoints((prev) => ({
      ...prev,
      [studentId]: Math.max(0, val)
    }));
    setSavedCount(null);
  };

  const handleApplyAll = (val: number) => {
    const updated: Record<string, number> = {};
    students.forEach((s) => {
      updated[s.id] = val;
    });
    setStudentPoints(updated);
    setSavedCount(null);
  };

  const handleClearAll = () => {
    setStudentPoints({});
    setSavedCount(null);
  };

  // Count active launches
  const activeLaunches = useMemo(() => {
    return Object.entries(studentPoints).filter(([_, pts]) => pts > 0);
  }, [studentPoints]);

  const totalPointsToAward = useMemo(() => {
    return activeLaunches.reduce((acc, [_, pts]) => acc + pts, 0);
  }, [activeLaunches]);

  const handleSaveAll = async () => {
    if (activeLaunches.length === 0) return;

    setIsSaving(true);
    try {
      const items = activeLaunches.map(([studentId, pts]) => {
        const student = students.find((s) => s.id === studentId);
        return {
          studentId,
          studentName: student?.name || 'Aluno',
          points: pts,
          categoryId: selectedCategory.id,
          categoryName: selectedCategory.name,
          date
        };
      });

      await recordQuickScores(items);
      setSavedCount(items.length);
      setStudentPoints({});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-12 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B192C] p-4 sm:p-5 rounded-3xl border border-blue-900/60 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Lançamento em Lote
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-blue-300 font-semibold">21 Valentes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none mt-0.5">
            Lançamento Rápido de Pontos
          </h2>
          <p className="text-xs text-blue-200/80">
            Lance pontuações para vários alunos simultaneamente com poucos toques no celular.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('lancamento')}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-200 text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
        >
          <span>Ir para Lançamento Individual</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Success Banner */}
      {savedCount !== null && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-emerald-900/50 to-slate-900 border-2 border-emerald-400 shadow-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                ✓ Lançamentos Salvos com Sucesso no Firestore!
              </p>
              <p className="text-sm font-extrabold text-white">
                {savedCount} pontuações registradas individualmente. Rankings recalculados em tempo real!
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('semanal')}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow cursor-pointer flex-shrink-0"
          >
            Ver Ranking
          </button>
        </div>
      )}

      {/* Configuration Bar: Category, Date, Teacher */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0B192C] p-4 rounded-2xl border border-blue-900/60 shadow-lg">
        {/* Category */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Categoria:</span>
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (+{c.defaultPoints || 10} pts)
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Data:</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Teacher */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Professor Responsável:</span>
          </label>
          <div className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="truncate">{userProfile?.name || 'Professor'}</span>
          </div>
        </div>
      </div>

      {/* Global Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#081220] p-3 rounded-2xl border border-blue-900/40">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Preencher:</span>
          <button
            type="button"
            onClick={() => handleApplyAll(10)}
            className="px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-bold"
          >
            +10 para Todos
          </button>
          <button
            type="button"
            onClick={() => handleApplyAll(20)}
            className="px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-bold"
          >
            +20 para Todos
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Zerar</span>
          </button>
        </div>

        <div className="relative min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#060D17] border border-blue-900/80 rounded-xl pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* 21 Students Quick List */}
      <div className="bg-[#0B192C] rounded-3xl border border-blue-900/60 overflow-hidden shadow-xl">
        <div className="p-3.5 sm:p-4 bg-[#081220] border-b border-blue-900/60 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider">
            Aluno ({filteredStudents.length})
          </span>
          <span className="font-bold text-amber-400 uppercase tracking-wider">
            Pontos a lançar
          </span>
        </div>

        <div className="divide-y divide-blue-900/40 max-h-[500px] overflow-y-auto scrollbar-thin">
          {filteredStudents.map((student) => {
            const currentPoints = studentPoints[student.id] || 0;

            return (
              <div
                key={student.id}
                className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors ${
                  currentPoints > 0 ? 'bg-blue-950/50' : 'hover:bg-blue-950/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase flex-shrink-0 ${
                      currentPoints > 0
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'bg-blue-900/40 text-blue-300'
                    }`}
                  >
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{student.name}</h4>
                    <span className="text-[11px] text-blue-300/60">Valente</span>
                  </div>
                </div>

                {/* Point Adjusters: [+10], [+20], [+30], [-5], [+5] */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdjustPoints(student.id, 10)}
                    className="px-2.5 py-1 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-amber-300 text-xs font-black uppercase active:scale-95 transition-all"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustPoints(student.id, 20)}
                    className="px-2.5 py-1 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-amber-300 text-xs font-black uppercase active:scale-95 transition-all"
                  >
                    +20
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustPoints(student.id, 30)}
                    className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-amber-300 text-xs font-black uppercase active:scale-95 transition-all"
                  >
                    +30
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustPoints(student.id, -5)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center active:scale-90"
                    title="Diminuir 5 pontos"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={currentPoints === 0 ? '' : currentPoints}
                    placeholder="0"
                    onChange={(e) => handleSetPoints(student.id, Number(e.target.value) || 0)}
                    className={`w-14 sm:w-16 text-center py-1 rounded-xl border text-sm font-black font-['Teko',sans-serif] text-lg focus:outline-none ${
                      currentPoints > 0
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                        : 'bg-[#060D17] text-white border-blue-900'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => handleAdjustPoints(student.id, 5)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center active:scale-90"
                    title="Adicionar 5 pontos"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Sticky Bottom Bar for Salvar Lançamentos */}
      <div className="sticky bottom-4 z-30 bg-[#0B192C]/95 backdrop-blur-lg border-2 border-amber-400 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {activeLaunches.length} aluno(s) selecionado(s)
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-blue-300 font-semibold">
              Categoria: {selectedCategory.name}
            </span>
          </div>
          <p className="text-xs text-amber-300 font-black mt-0.5">
            Total a distribuir: {totalPointsToAward} pontos
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving || activeLaunches.length === 0}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {isSaving
              ? 'Gravando no Firestore...'
              : `SALVAR ${activeLaunches.length} LANÇAMENTOS`}
          </span>
        </button>
      </div>
    </div>
  );
};
