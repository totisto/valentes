import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LionBadge, ChampionCrown } from '../common/BrandAssets';
import {
  ShieldAlert,
  UserPlus,
  Users,
  UserCheck,
  Trash2,
  Download,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Award,
  Layers,
  BarChart3,
  TrendingUp,
  Settings,
  Edit2,
  Check,
  X,
  Mail,
  KeyRound,
  Clock,
  Calendar,
  Sparkles,
  ShieldCheck,
  Link2
} from 'lucide-react';
import { UserProfile } from '../../types';

export const AdminView: React.FC = () => {
  const {
    students,
    teachers,
    categories,
    entries,
    createStudent,
    modifyStudent,
    removeStudent,
    createCategory,
    modifyCategory,
    removeCategory,
    createTeacher,
    modifyTeacherProfile,
    modifyTeacherRole,
    toggleTeacherActive,
    removeTeacher,
    exportCSV,
    exportJSON,
    setActiveTab
  } = useApp();
  const { isAdmin, currentUser, linkStudentAccount } = useAuth();

  const isPrincipalAdmin = currentUser?.email?.toLowerCase() === 'lucasj6k@gmail.com' || isAdmin;

  const [activeAdminTab, setActiveAdminTab] = useState<'teachers' | 'students' | 'categories' | 'reports' | 'links'>('teachers');

  // Filter users by role
  const teacherUsers = useMemo(() => teachers.filter((t) => t.role !== 'student'), [teachers]);
  const studentUsers = useMemo(() => teachers.filter((t) => t.role === 'student'), [teachers]);

  // Account Linking State
  const [linkingFeedback, setLinkingFeedback] = useState<string | null>(null);
  const [selectedLinkStudent, setSelectedLinkStudent] = useState<Record<string, string>>({});

  // Teacher Management State
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [teacherFeedback, setTeacherFeedback] = useState<string | null>(null);

  // Edit Teacher State
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherEmail, setEditTeacherEmail] = useState('');

  // New Student state
  const [newStudentName, setNewStudentName] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState('');

  // New Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatPoints, setNewCatPoints] = useState<number>(10);
  const [newCatDesc, setNewCatDesc] = useState('');

  // Report calculations
  const totalPointsAll = useMemo(() => {
    return entries.reduce((acc, curr) => acc + (curr.points !== undefined ? curr.points : (curr as any).total || 0), 0);
  }, [entries]);

  const pointsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => {
      const cat = e.categoryName || 'Geral';
      const pts = e.points !== undefined ? e.points : (e as any).total || 0;
      map[cat] = (map[cat] || 0) + pts;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const pointsByTeacher = useMemo(() => {
    const map: Record<string, { points: number; count: number }> = {};
    entries.forEach((e) => {
      const t = e.teacherName || 'Professor';
      const pts = e.points !== undefined ? e.points : (e as any).total || 0;
      if (!map[t]) map[t] = { points: 0, count: 0 };
      map[t].points += pts;
      map[t].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].points - a[1].points);
  }, [entries]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherEmail.trim()) return;
    if (!newTeacherPassword.trim() || newTeacherPassword.trim().length < 6) {
      alert('A senha inicial do professor deve ter no mínimo 6 caracteres.');
      return;
    }
    setIsSavingTeacher(true);
    setTeacherFeedback(null);
    try {
      await createTeacher({
        name: newTeacherName.trim(),
        email: newTeacherEmail.trim().toLowerCase(),
        initialPassword: newTeacherPassword.trim()
      });
      setTeacherFeedback(`Professor(a) "${newTeacherName}" adicionado(a) com sucesso!`);
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherPassword('');
      setShowAddTeacherModal(false);
      setTimeout(() => setTeacherFeedback(null), 4000);
    } catch (err: any) {
      alert('Erro ao criar professor: ' + err.message);
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const handleSaveEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editTeacherName.trim() || !editTeacherEmail.trim()) return;
    setIsSavingTeacher(true);
    try {
      await modifyTeacherProfile(editingTeacher.id, {
        name: editTeacherName.trim(),
        email: editTeacherEmail.trim().toLowerCase()
      });
      setEditingTeacher(null);
      setTeacherFeedback(`Dados de "${editTeacherName}" atualizados com sucesso!`);
      setTimeout(() => setTeacherFeedback(null), 3500);
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    await createStudent(newStudentName);
    setNewStudentName('');
  };

  const handleSaveStudentEdit = async (id: string) => {
    if (!editingStudentName.trim()) return;
    await modifyStudent(id, { name: editingStudentName.trim() });
    setEditingStudentId(null);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await createCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim(),
      defaultPoints: newCatPoints
    });
    setNewCatName('');
    setNewCatDesc('');
    setNewCatPoints(10);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B192C] p-4 sm:p-5 rounded-3xl border border-blue-900/60 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Acesso Restrito
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-blue-300 font-semibold">Painel Administrativo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko',sans-serif] tracking-wide uppercase leading-none mt-0.5">
              Administração dos Valentes
            </h2>
            <p className="text-xs text-blue-200/80">
              Controle completo de alunos, professores, categorias de pontuação, relatórios e backups.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCSV()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => exportJSON()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>JSON Backup</span>
          </button>
        </div>
      </div>

      {/* Admin Section Tabs */}
      <div className="flex items-center gap-2 border-b border-blue-900/60 pb-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveAdminTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeAdminTab === 'students'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Alunos ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('teachers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeAdminTab === 'teachers'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Professores ({teacherUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('links')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeAdminTab === 'links'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Vínculo de Contas ({studentUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeAdminTab === 'categories'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Categorias ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeAdminTab === 'reports'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Relatórios</span>
        </button>
      </div>

      {/* Tab 1: Students Management */}
      {activeAdminTab === 'students' && (
        <div className="space-y-5">
          {/* Add Student Card */}
          <div className="bg-[#0B192C] p-4 sm:p-5 rounded-3xl border border-blue-900/60 shadow-lg space-y-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Cadastrar Novo Aluno</span>
            </h3>

            <form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nome do adolescente..."
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="flex-1 bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Adicionar Aluno</span>
              </button>
            </form>
          </div>

          {/* Students List */}
          <div className="bg-[#0B192C] rounded-3xl border border-blue-900/60 overflow-hidden shadow-xl">
            <div className="p-4 bg-[#081220] border-b border-blue-900/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase">
                Lista de Alunos ({students.length})
              </span>
              <span className="text-blue-300/80">Todos aparecem nos rankings</span>
            </div>

            <div className="divide-y divide-blue-900/40">
              {students.map((student) => (
                <div key={student.id} className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-blue-950/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                      {student.name.charAt(0)}
                    </div>
                    {editingStudentId === student.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingStudentName}
                          onChange={(e) => setEditingStudentName(e.target.value)}
                          className="bg-[#060D17] border border-amber-400 rounded-lg px-2 py-1 text-xs text-white"
                        />
                        <button
                          onClick={() => handleSaveStudentEdit(student.id)}
                          className="p-1 rounded bg-emerald-600 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingStudentId(null)}
                          className="p-1 rounded bg-slate-700 text-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{student.name}</span>
                          {!student.active && (
                            <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800">
                              Inativo
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">{student.id}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => modifyStudent(student.id, { active: !student.active })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                        student.active
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {student.active ? 'Ativo' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingStudentId(student.id);
                        setEditingStudentName(student.name);
                      }}
                      className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remover ${student.name} da lista?`)) {
                          removeStudent(student.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Gerenciar Professores (Exclusivo do Administrador Principal) */}
      {activeAdminTab === 'teachers' && (
        <div className="space-y-5">
          {/* Top Admin Security Notice */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-blue-900/40 to-blue-950/80 border border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Administrador Principal Autorizado
                </span>
                <span className="text-xs text-white font-mono font-bold">
                  lucasj6k@gmail.com
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setNewTeacherName('');
                setNewTeacherEmail('');
                setNewTeacherPassword('');
                setShowAddTeacherModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Adicionar Professor</span>
            </button>
          </div>

          {/* Feedback Banner */}
          {teacherFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{teacherFeedback}</span>
            </div>
          )}

          {/* Gerenciar Professores List Card */}
          <div className="bg-[#0B192C] rounded-3xl border border-blue-900/60 overflow-hidden shadow-xl">
            <div className="p-4 bg-[#081220] border-b border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-extrabold text-white uppercase text-sm tracking-wide">
                  GERENCIAR PROFESSORES
                </span>
                <p className="text-[11px] text-blue-300/70">
                  Total de {teacherUsers.length} professores cadastrados no sistema
                </p>
              </div>
              <span className="text-[11px] text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                Cadastro público bloqueado · Apenas Admin cria professores
              </span>
            </div>

            {/* List */}
            <div className="divide-y divide-blue-900/40">
              {teacherUsers.map((teacher) => {
                const isLucas = teacher.email.toLowerCase() === 'lucasj6k@gmail.com';
                const dateCreatedFormatted = teacher.createdAt
                  ? new Date(teacher.createdAt).toLocaleDateString('pt-BR')
                  : '01/01/2026';
                const lastAccess = teacher.lastLogin || '07/10/2026 10:30';

                return (
                  <div
                    key={teacher.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-blue-950/30 transition-colors"
                  >
                    {/* Left: Info */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 border border-blue-600/50 text-white font-black flex items-center justify-center text-sm shadow-md flex-shrink-0">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{teacher.name}</h4>
                          {isLucas ? (
                            <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                              Admin Principal
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded-full">
                              Professor
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-blue-300/80 font-mono mt-0.5">{teacher.email}</p>

                        {/* Metadata row: Data de cadastro & Último acesso */}
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>Cadastro: {dateCreatedFormatted}</span>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Último acesso: {lastAccess}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      {/* Status badge */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border ${
                          teacher.active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {teacher.active ? 'ATIVO' : 'INATIVO'}
                      </span>

                      {/* Action buttons */}
                      {!isLucas && (
                        <>
                          {/* Toggle Active button */}
                          <button
                            onClick={() => toggleTeacherActive(teacher.id, !teacher.active)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all active:scale-95 cursor-pointer ${
                              teacher.active
                                ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                            }`}
                          >
                            {teacher.active ? 'Desativar' : 'Ativar'}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setEditingTeacher(teacher);
                              setEditTeacherName(teacher.name);
                              setEditTeacherEmail(teacher.email);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-bold uppercase border border-blue-700/50 transition-all active:scale-95 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>

                          {/* Remove button */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja remover o professor "${teacher.name}"? Esta ação não pode ser desfeita.`)) {
                                removeTeacher(teacher.id);
                              }
                            }}
                            className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-all active:scale-95 cursor-pointer"
                            title="Remover Professor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Professor */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0B192C] border-2 border-blue-900 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Adicionar Novo Professor
                </h3>
              </div>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-blue-900/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  required
                  className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>E-mail do Professor:</span>
                </label>
                <input
                  type="email"
                  placeholder="joao@email.com"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  required
                  className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Senha Inicial:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = 'Val@' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(100 + Math.random() * 900);
                      setNewTeacherPassword(randomPass);
                    }}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Gerar Senha Única
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Mínimo 6 caracteres..."
                  value={newTeacherPassword}
                  onChange={(e) => setNewTeacherPassword(e.target.value)}
                  required
                  className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-emerald-400/90 font-medium mt-1">
                  A senha é utilizada exclusivamente no Firebase Auth para o primeiro login. Nenhuma senha é gravada no banco de dados Firestore.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeacher}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  {isSavingTeacher ? 'Cadastrando...' : 'Criar Professor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Professor */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0B192C] border-2 border-blue-900 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Editar Professor
                </h3>
              </div>
              <button
                onClick={() => setEditingTeacher(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-blue-900/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  required
                  className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                  E-mail:
                </label>
                <input
                  type="email"
                  value={editTeacherEmail}
                  onChange={(e) => setEditTeacherEmail(e.target.value)}
                  required
                  className="w-full bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeacher}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
                >
                  {isSavingTeacher ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Categories Management */}
      {activeAdminTab === 'categories' && (
        <div className="space-y-5">
          {/* Add Category Form */}
          <div className="bg-[#0B192C] p-4 sm:p-5 rounded-3xl border border-blue-900/60 shadow-lg space-y-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Adicionar Nova Categoria de Pontuação</span>
            </h3>

            <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Nome da categoria (ex: Dinâmica)..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                className="bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <input
                type="number"
                min="1"
                placeholder="Pontos padrão (ex: 10)"
                value={newCatPoints}
                onChange={(e) => setNewCatPoints(Number(e.target.value) || 10)}
                required
                className="bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <input
                type="text"
                placeholder="Descrição breve..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="bg-[#060D17] border border-blue-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow"
              >
                Criar Categoria
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-[#0B192C] rounded-3xl border border-blue-900/60 overflow-hidden shadow-xl">
            <div className="p-4 bg-[#081220] border-b border-blue-900/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase">
                Categorias Ativas ({categories.length})
              </span>
              <span className="text-blue-300/80">Critérios de avaliação dos Valentes</span>
            </div>

            <div className="divide-y divide-blue-900/40">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-blue-950/30">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                        +{cat.defaultPoints || 10} pts
                      </span>
                    </h4>
                    {cat.description && (
                      <p className="text-xs text-blue-300/70 mt-0.5">{cat.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => modifyCategory(cat.id, { active: !cat.active })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                        cat.active
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cat.active ? 'Ativa' : 'Desativada'}
                    </button>
                    {categories.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir categoria ${cat.name}?`)) {
                            removeCategory(cat.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Reports */}
      {activeAdminTab === 'reports' && (
        <div className="space-y-5">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0B192C] p-4 rounded-2xl border border-blue-900/60">
              <span className="text-xs text-blue-300 uppercase font-semibold">Total Geral</span>
              <p className="text-3xl font-black text-amber-400 font-['Teko',sans-serif] mt-1 leading-none">
                {totalPointsAll.toLocaleString('pt-BR')} pts
              </p>
            </div>
            <div className="bg-[#0B192C] p-4 rounded-2xl border border-blue-900/60">
              <span className="text-xs text-blue-300 uppercase font-semibold">Lançamentos</span>
              <p className="text-3xl font-black text-white font-['Teko',sans-serif] mt-1 leading-none">
                {entries.length}
              </p>
            </div>
            <div className="bg-[#0B192C] p-4 rounded-2xl border border-blue-900/60">
              <span className="text-xs text-blue-300 uppercase font-semibold">Alunos</span>
              <p className="text-3xl font-black text-emerald-400 font-['Teko',sans-serif] mt-1 leading-none">
                {students.length}
              </p>
            </div>
            <div className="bg-[#0B192C] p-4 rounded-2xl border border-blue-900/60">
              <span className="text-xs text-blue-300 uppercase font-semibold">Professores</span>
              <p className="text-3xl font-black text-blue-400 font-['Teko',sans-serif] mt-1 leading-none">
                {teachers.length}
              </p>
            </div>
          </div>

          {/* Breakdown by Category */}
          <div className="bg-[#0B192C] p-4 sm:p-5 rounded-3xl border border-blue-900/60 shadow-xl space-y-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Pontos Distribuídos por Categoria</span>
            </h3>

            <div className="space-y-2">
              {pointsByCategory.map(([catName, pts]) => {
                const percent = totalPointsAll > 0 ? Math.round((pts / totalPointsAll) * 100) : 0;
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white font-bold">{catName}</span>
                      <span className="text-amber-300 font-black">{pts} pts ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-blue-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-amber-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown by Teacher */}
          <div className="bg-[#0B192C] p-4 sm:p-5 rounded-3xl border border-blue-900/60 shadow-xl space-y-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Lançamentos por Professor</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pointsByTeacher.map(([tName, data]) => (
                <div key={tName} className="p-3 rounded-2xl bg-[#060D17] border border-blue-900/60 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{tName}</h4>
                    <p className="text-xs text-blue-300/70">{data.count} avaliações registradas</p>
                  </div>
                  <span className="text-xl font-black text-amber-400 font-['Teko',sans-serif]">
                    {data.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Vínculo Único entre Conta Autenticada e Aluno */}
      {activeAdminTab === 'links' && (
        <div className="space-y-5">
          {/* Informational Card */}
          <div className="bg-[#0B192C] p-5 rounded-3xl border border-blue-900/60 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wider">
              <Link2 className="w-5 h-5" />
              <span>Vínculo Único de Contas Autenticadas</span>
            </div>
            <p className="text-xs text-blue-200/90 leading-relaxed">
              O Firebase Auth identifica o usuário pelo seu <strong>UID</strong>. O campo <strong>studentId</strong> é a referência canônica que conecta essa conta às pontuações históricas e aos registros oficiais dos 21 alunos. Em caso de contas recém-criadas ou nomes ambíguos, selecione o aluno canônico abaixo para efetivar a vinculação.
            </p>
            {linkingFeedback && (
              <div className="p-3 mt-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{linkingFeedback}</span>
              </div>
            )}
          </div>

          {/* List of Student Accounts */}
          <div className="bg-[#0B192C] rounded-3xl border border-blue-900/60 overflow-hidden shadow-xl">
            <div className="p-4 bg-[#081220] border-b border-blue-900/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase">
                Contas com Perfil de Aluno ({studentUsers.length})
              </span>
              <span className="text-blue-300/80">Vínculo Direto ao Cadastro Canônico</span>
            </div>

            {studentUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhuma conta de aluno cadastrada no momento. Alunos que criarem conta via e-mail ou Google aparecerão aqui para vinculação.
              </div>
            ) : (
              <div className="divide-y divide-blue-900/40">
                {studentUsers.map((stuUser) => {
                  const linkedStudent = students.find((s) => s.id === stuUser.studentId);
                  const selectedTargetId = selectedLinkStudent[stuUser.id] || stuUser.studentId || '';

                  return (
                    <div
                      key={stuUser.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-blue-950/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md flex-shrink-0">
                          {stuUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">{stuUser.name}</h4>
                            {stuUser.studentId ? (
                              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                                Vinculado: {linkedStudent?.name || stuUser.studentId}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                                Aguardando Vínculo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-blue-300/80 font-mono mt-0.5">{stuUser.email}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">UID: {stuUser.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                        <select
                          value={selectedTargetId}
                          onChange={(e) =>
                            setSelectedLinkStudent((prev) => ({
                              ...prev,
                              [stuUser.id]: e.target.value
                            }))
                          }
                          className="bg-[#060D17] border border-blue-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                        >
                          <option value="">Selecione o Aluno Canônico...</option>
                          {students.map((std) => (
                            <option key={std.id} value={std.id}>
                              {std.name} ({std.id})
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={async () => {
                            if (!selectedTargetId) {
                              alert('Selecione um aluno da lista antes de salvar.');
                              return;
                            }
                            try {
                              await linkStudentAccount(stuUser.id, selectedTargetId);
                              const targetStudentObj = students.find((s) => s.id === selectedTargetId);
                              setLinkingFeedback(
                                `Conta "${stuUser.name}" vinculada com sucesso a ${targetStudentObj?.name || selectedTargetId}!`
                              );
                              setTimeout(() => setLinkingFeedback(null), 5000);
                            } catch (err: any) {
                              alert('Erro ao vincular conta: ' + err.message);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow active:scale-95 transition-all cursor-pointer"
                        >
                          Salvar Vínculo
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
