import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getTodayDateStr } from '../../utils/dateUtils';
import { LionBadge, ChampionCrown } from '../common/BrandAssets';
import {
  CheckCircle2,
  Calendar,
  User,
  Zap,
  ArrowRight,
  Sparkles,
  Search,
  Clock,
  Award,
  Layers,
  PlusCircle,
  FileText
} from 'lucide-react';

export const ScoreEntryView: React.FC = () => {
  const {
    students,
    teachers,
    categories,
    activeTeacher,
    recordScore,
    setActiveTab,
    entries
  } = useApp();
  const { userProfile } = useAuth();

  const [date, setDate] = useState<string>(getTodayDateStr());
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [points, setPoints] = useState<number>(10);
  const [studentSearch, setStudentSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [savedSuccessInfo, setSavedSuccessInfo] = useState<{
    studentName: string;
    categoryName: string;
    points: number;
    id: string;
  } | null>(null);

  // Set default student and category if none selected
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    return students.filter((s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase().trim())
    );
  }, [students, studentSearch]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || categories[0];
  }, [categories, selectedCategoryId]);

  // Check which students already have an entry today
  const studentsWithEntryToday = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.date === date) {
        set.add(e.studentId);
      }
    });
    return set;
  }, [entries, date]);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStudentId || !selectedCategoryId) return;

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    setIsSaving(true);
    try {
      const created = await recordScore({
        studentId: student.id,
        studentName: student.name,
        points: Math.max(0, points),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        date,
        notes
      });

      setSavedSuccessInfo({
        studentName: student.name,
        categoryName: selectedCategory.name,
        points: created.points,
        id: created.id
      });

      setNotes('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectNextStudent = () => {
    setSavedSuccessInfo(null);
    const currentIndex = students.findIndex((s) => s.id === selectedStudentId);
    if (currentIndex >= 0 && currentIndex < students.length - 1) {
      setSelectedStudentId(students[currentIndex + 1].id);
    } else if (students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-12 space-y-5">
      {/* View Header with Shortcut to Lançamento Rápido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B192C] p-4 sm:p-5 rounded-3xl border border-blue-900/60 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Registro Oficial de Pontos
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Firestore Nuvem
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none mt-0.5">
            Lançar Pontuação
          </h2>
          <p className="text-xs text-blue-200/80">
            Selecione o aluno, categoria e pontuação. Os rankings são atualizados em tempo real.
          </p>
        </div>

        {/* Lançamento Rápido button */}
        <button
          onClick={() => setActiveTab('lancamento-rapido')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-700/25 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Lançamento Rápido (Multi-Alunos)</span>
        </button>
      </div>

      {/* Success Confirmation Banner */}
      {savedSuccessInfo && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-emerald-900/50 to-slate-900 border-2 border-emerald-400 shadow-xl shadow-emerald-950/40 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>✓ Pontuação Registrada com Sucesso no Firestore!</span>
                </p>
                <p className="text-base font-extrabold text-white">
                  {savedSuccessInfo.studentName} —{' '}
                  <span className="text-amber-400">+{savedSuccessInfo.points} pts</span> ({savedSuccessInfo.categoryName})
                </p>
                <p className="text-[11px] text-emerald-200/80">
                  ⚡ O ranking semanal, mensal e anual de todos os usuários já foi recalculado automaticamente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleSelectNextStudent}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow active:scale-95 transition-all cursor-pointer"
              >
                <span>Próximo Aluno</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSavedSuccessInfo(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1: Date & Teacher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0B192C]/90 p-3 sm:p-4 rounded-2xl border border-blue-900/50 shadow-lg">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Data do Lançamento:</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2.5 text-white text-sm font-semibold focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Professor Responsável:</span>
            </label>
            <div className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2.5 text-white text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{userProfile?.name || 'Professor'}</span>
              <span className="text-[10px] text-amber-400 uppercase font-black ml-auto bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                {userProfile?.role === 'admin' ? 'Admin' : 'Docente'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Student Selection Grid (All 21 Students) */}
        <div className="bg-[#0B192C]/90 p-3 sm:p-4 rounded-2xl border border-blue-900/50 shadow-lg space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
              <ChampionCrown className="w-3.5 h-3.5 text-amber-400" />
              <span>Selecione o Aluno (Valente):</span>
            </label>
            <span className="text-[11px] text-blue-300 font-medium">
              {studentsWithEntryToday.size} de {students.length} com pontuação hoje
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar aluno por nome..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full bg-[#060D17] border border-blue-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* 21 Student Buttons Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-1 scrollbar-thin">
            {filteredStudents.map((s) => {
              const isSelected = s.id === selectedStudentId;
              const hasToday = studentsWithEntryToday.has(s.id);

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    setSavedSuccessInfo(null);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold transition-all text-center relative truncate cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-white scale-[1.02]'
                      : hasToday
                      ? 'bg-blue-900/60 text-blue-200 hover:bg-blue-800 border border-blue-700/60'
                      : 'bg-[#060D17] text-slate-300 hover:bg-blue-950 border border-blue-900/40'
                  }`}
                >
                  <span className="truncate block">{s.name}</span>
                  {hasToday && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Category Selection */}
        <div className="bg-[#0B192C]/90 p-3 sm:p-4 rounded-2xl border border-blue-900/50 shadow-lg space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Selecione a Categoria:</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
            {categories.filter(c => c.active).map((cat) => {
              const isSelected = cat.id === selectedCategoryId;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    if (cat.defaultPoints) setPoints(cat.defaultPoints);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md ring-2 ring-amber-400'
                      : 'bg-[#060D17] text-slate-300 hover:bg-blue-950 border border-blue-900/40'
                  }`}
                >
                  <span className="block truncate">{cat.name}</span>
                  <span className="text-[10px] text-blue-300/80 block mt-0.5">
                    +{cat.defaultPoints || 10} pts
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Points Input & Quick Point Adjusters */}
        <div className="bg-[#0B192C]/90 p-4 rounded-2xl border border-blue-900/50 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Pontos a Atribuir:</span>
            </label>

            <span className="text-3xl font-black text-amber-400 font-['Teko',sans-serif] leading-none">
              {points} PONTOS
            </span>
          </div>

          {/* Quick Point Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {[5, 10, 15, 20, 25, 30, 40, 50].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setPoints(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  points === val
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-white'
                    : 'bg-[#060D17] text-slate-300 hover:bg-blue-950 border border-blue-900/50'
                }`}
              >
                +{val}
              </button>
            ))}

            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => setPoints(Math.max(0, points - 5))}
                className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 text-white font-bold"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setPoints(points + 5)}
                className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 text-white font-bold"
              >
                +5
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Notes (Optional) */}
        <div className="bg-[#0B192C]/90 p-3 sm:p-4 rounded-2xl border border-blue-900/50 shadow-lg">
          <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Observação (Opcional):</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Excelente participação na dinâmica e pontualidade exemplar..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving || !selectedStudentId}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 font-black text-base uppercase tracking-wider shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.5]" />
          <span>
            {isSaving
              ? 'Salvando no Firestore...'
              : `LANÇAR ${points} PONTOS PARA ${selectedStudent?.name || 'ALUNO'}`}
          </span>
        </button>
      </form>
    </div>
  );
};
