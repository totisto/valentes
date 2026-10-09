import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ScoreEntry } from '../../types';
import { formatDateBR, formatDateTimeBR } from '../../utils/dateUtils';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Users,
  Award,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Sparkles
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const {
    entries,
    students,
    teachers,
    categories,
    updateScore,
    deleteScore,
    exportCSV
  } = useApp();
  const { isAdmin, userProfile } = useAuth();

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterWeek, setFilterWeek] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing state
  const [editingEntry, setEditingEntry] = useState<ScoreEntry | null>(null);

  // Deletion Confirmation Modal state
  const [deletingEntry, setDeletingEntry] = useState<ScoreEntry | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');

  // Distinct weeks and months
  const distinctWeeks = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.week) set.add(e.week);
    });
    return Array.from(set);
  }, [entries]);

  const distinctMonths = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((e) => {
      if (e.month) map.set(e.month, e.monthLabel || e.month);
    });
    return Array.from(map.entries());
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
      if (filterWeek !== 'all' && entry.week !== filterWeek) return false;
      if (filterMonth !== 'all' && entry.month !== filterMonth) return false;
      if (filterTeacher !== 'all' && entry.teacherId !== filterTeacher) return false;
      if (filterStudent !== 'all' && entry.studentId !== filterStudent) return false;
      if (filterCategory !== 'all' && entry.categoryId !== filterCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = entry.studentName.toLowerCase().includes(query);
        const matchesTeacher = entry.teacherName.toLowerCase().includes(query);
        const matchesCat = (entry.categoryName || '').toLowerCase().includes(query);
        const matchesId = entry.id.toLowerCase().includes(query);
        if (!matchesName && !matchesTeacher && !matchesCat && !matchesId) return false;
      }
      return true;
    });
  }, [
    entries,
    startDate,
    endDate,
    filterWeek,
    filterMonth,
    filterTeacher,
    filterStudent,
    filterCategory,
    searchQuery
  ]);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterWeek('all');
    setFilterMonth('all');
    setFilterTeacher('all');
    setFilterStudent('all');
    setFilterCategory('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    startDate !== '' ||
    endDate !== '' ||
    filterWeek !== 'all' ||
    filterMonth !== 'all' ||
    filterTeacher !== 'all' ||
    filterStudent !== 'all' ||
    filterCategory !== 'all' ||
    searchQuery.trim() !== '';

  const confirmDelete = async () => {
    if (!deletingEntry) return;
    await deleteScore(deletingEntry.id);
    setDeletingEntry(null);
    setDeleteReason('');
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-12 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B192C] p-4 sm:p-5 rounded-3xl border border-blue-900/60 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Auditoria & Histórico Completo
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-blue-300 font-semibold">
              {filteredEntries.length} de {entries.length} lançamentos
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none mt-0.5">
            Histórico de Pontuações
          </h2>
          <p className="text-xs text-blue-200/80">
            Registro detalhado de cada pontuação com data, professor, aluno, categoria e horário.
          </p>
        </div>

        <button
          onClick={() => exportCSV(filteredEntries)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900/80 hover:bg-blue-800 border border-blue-700/80 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Exportar Planilha (CSV)</span>
        </button>
      </div>

      {/* Filter Controls Panel */}
      <div className="bg-[#0B192C] rounded-3xl border border-blue-900/60 p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
            <Filter className="w-4 h-4" />
            <span>Filtros Avançados:</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar por nome do aluno, professor, categoria ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#060D17] border border-blue-800/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Data Inicial:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#060D17] border border-blue-900 rounded-lg p-1.5 text-white text-xs"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Data Final:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#060D17] border border-blue-900 rounded-lg p-1.5 text-white text-xs"
            />
          </div>

          {/* Student */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Aluno:</label>
            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="w-full bg-[#060D17] border border-blue-900 rounded-lg p-1.5 text-white text-xs"
            >
              <option value="all">Todos ({students.length})</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Professor:</label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full bg-[#060D17] border border-blue-900 rounded-lg p-1.5 text-white text-xs"
            >
              <option value="all">Todos ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Categoria:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-[#060D17] border border-blue-900 rounded-lg p-1.5 text-white text-xs"
            >
              <option value="all">Todas ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Week */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Semana:</label>
            <select
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              className="w-full bg-[#060D17] border border-blue-900 rounded-lg p-1.5 text-white text-xs"
            >
              <option value="all">Todas</option>
              {distinctWeeks.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Score Entries Table */}
      <div className="bg-[#0B192C] rounded-3xl border border-blue-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081220] border-b border-blue-900/60 text-[11px] font-black uppercase tracking-wider text-slate-300">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Professor</th>
                <th className="py-3 px-4">Aluno</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-center">Pontos</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/40">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-blue-950/40 transition-colors">
                    {/* Data */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-white block">{formatDateBR(entry.date)}</span>
                      <span className="text-[10px] text-slate-400">{entry.week || entry.month}</span>
                    </td>

                    {/* Professor */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-200">
                      {entry.teacherName}
                    </td>

                    {/* Aluno */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-amber-300 block">{entry.studentName}</span>
                      <span className="text-[10px] text-slate-500">{entry.id}</span>
                    </td>

                    {/* Categoria */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-900/40 border border-blue-800 text-blue-200 font-semibold">
                        {entry.categoryName || 'Geral'}
                      </span>
                      {entry.notes && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-xs">
                          "{entry.notes}"
                        </p>
                      )}
                    </td>

                    {/* Pontos */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-xl font-black text-amber-400 font-['Teko',sans-serif] leading-none">
                        +{entry.points !== undefined ? entry.points : (entry as any).total || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">pts</span>
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 hover:text-white transition-colors cursor-pointer"
                          title="Editar e atualizar lançamento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingEntry(entry)}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Exclusão com Confirmação e Motivo */}
      {deletingEntry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0B192C] border-2 border-rose-500 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-white font-['Teko',sans-serif] leading-none">
                  Confirmar Exclusão
                </h3>
                <span className="text-[11px] text-rose-300 font-semibold">Ação do Administrador</span>
              </div>
            </div>

            <p className="text-sm text-slate-200">
              Tem certeza que deseja excluir este lançamento de{' '}
              <strong className="text-amber-300 font-bold">{deletingEntry.studentName}</strong> (+
              {deletingEntry.points} pts em {deletingEntry.categoryName})?
            </p>

            <div className="p-3 rounded-xl bg-[#060D17] border border-blue-900/60 text-xs text-slate-400 space-y-1">
              <div>Lançado por: <strong className="text-white">{deletingEntry.teacherName}</strong></div>
              <div>Data: <strong className="text-white">{formatDateBR(deletingEntry.date)}</strong></div>
              <div>ID: <span className="font-mono text-[10px]">{deletingEntry.id}</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Motivo da Exclusão (Auditoria):
              </label>
              <input
                type="text"
                placeholder="Ex: Lançamento duplicado pelo professor..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEntry(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30"
              >
                Sim, Excluir Lançamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição (Admin) */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0B192C] border-2 border-amber-400 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-900">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Modo Administrador
                </span>
                <h3 className="text-xl font-black text-white font-['Teko',sans-serif] leading-none">
                  Editar Lançamento
                </h3>
                <p className="text-xs text-blue-300">{editingEntry.studentName} · {editingEntry.id}</p>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-blue-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await updateScore(editingEntry.id, editingEntry);
                setEditingEntry(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Data:</label>
                <input
                  type="date"
                  value={editingEntry.date}
                  onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                  className="w-full bg-[#060D17] border border-blue-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Categoria:</label>
                <select
                  value={editingEntry.categoryId}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.id === e.target.value);
                    setEditingEntry({
                      ...editingEntry,
                      categoryId: e.target.value,
                      categoryName: cat?.name || editingEntry.categoryName
                    });
                  }}
                  className="w-full bg-[#060D17] border border-blue-800 rounded-lg p-2 text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pontos:</label>
                <input
                  type="number"
                  min="0"
                  value={editingEntry.points}
                  onChange={(e) => setEditingEntry({ ...editingEntry, points: Number(e.target.value) || 0 })}
                  className="w-full bg-[#060D17] border border-blue-800 rounded-lg p-2 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observação:</label>
                <input
                  type="text"
                  value={editingEntry.notes || ''}
                  onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
                  className="w-full bg-[#060D17] border border-blue-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
