import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Student,
  UserProfile,
  Category,
  ScoreEntry,
  ActiveTab,
  RankingItem,
  LiveNotification,
  Role
} from '../types';
import {
  seedInitialStudentsIfEmpty,
  subscribeStudents,
  addStudent as addStudentService,
  updateStudent as updateStudentService,
  deleteStudent as deleteStudentService
} from '../services/studentService';
import {
  seedInitialCategoriesIfEmpty,
  subscribeCategories,
  addCategory as addCategoryService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService
} from '../services/categoryService';
import {
  subscribeScoreEntries,
  fetchAllScoreEntriesOnce,
  createScoreEntry as createScoreEntryService,
  createBatchScoreEntries as createBatchScoreEntriesService,
  updateScoreEntry as updateScoreEntryService,
  deleteScoreEntry as deleteScoreEntryService
} from '../services/scoreService';
import {
  seedInitialTeachersIfEmpty,
  subscribeUsers,
  createTeacherUser,
  updateTeacherProfile as updateTeacherProfileService,
  updateUserRole as updateUserRoleService,
  toggleUserActive as toggleUserActiveService,
  deleteUser as deleteUserService
} from '../services/userService';
import { INITIAL_STUDENTS, INITIAL_CATEGORIES } from '../data/initialData';
import { useAuth } from './AuthContext';

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch {}
}

function triggerVibration() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([120, 80, 120]);
    }
  } catch {}
}

function showSystemNotification(title: string, body: string) {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/apple-touch-icon.png',
        badge: '/icons/apple-touch-icon.png',
      });
    }
  } catch {}
}

interface AppContextType {
  students: Student[];
  teachers: UserProfile[];
  categories: Category[];
  entries: ScoreEntry[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  effectiveStudentId: string;
  activeStudentId: string;
  setActiveStudentId: (id: string) => void;
  activeStudent: Student | undefined;
  activeTeacher: UserProfile | undefined;
  isOnline: boolean;
  serverOnline: boolean;
  isLoadingData: boolean;
  liveAlert: LiveNotification | null;
  notificationsList: LiveNotification[];
  clearLiveAlert: () => void;
  userRole: Role | 'student' | null;

  // Realtime Sync helper
  syncNow: () => Promise<void>;
  isSyncing: boolean;

  // Quick Score Update Modal helper
  isScoreUpdateModalOpen: boolean;
  targetUpdateStudentId: string | null;
  openScoreUpdateModal: (studentId?: string) => void;
  closeScoreUpdateModal: () => void;

  // Actions
  recordScore: (data: {
    studentId: string;
    studentName: string;
    points: number;
    categoryId?: string;
    categoryName?: string;
    teacherId?: string;
    teacherName?: string;
    date: string;
    notes?: string;
    pontualidade?: number;
    comportamento?: number;
    presenca?: number;
    participacao?: number;
    atividade?: number;
  }) => Promise<ScoreEntry>;

  recordQuickScores: (
    items: {
      studentId: string;
      studentName: string;
      points: number;
      categoryId?: string;
      categoryName?: string;
      teacherId?: string;
      teacherName?: string;
      date: string;
      notes?: string;
    }[]
  ) => Promise<ScoreEntry[]>;

  updateScore: (id: string, updates: Partial<ScoreEntry>) => Promise<void>;
  deleteScore: (id: string) => Promise<void>;

  // Student management
  createStudent: (name: string) => Promise<Student>;
  modifyStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;

  // Category management
  createCategory: (data: { name: string; description?: string; defaultPoints?: number; iconName?: string }) => Promise<Category>;
  modifyCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  // Teacher management
  createTeacher: (data: { name: string; email: string; initialPassword?: string }) => Promise<UserProfile>;
  modifyTeacherProfile: (id: string, data: { name?: string; email?: string; role?: Role; active?: boolean }) => Promise<void>;
  modifyTeacherRole: (id: string, role: Role) => Promise<void>;
  toggleTeacherActive: (id: string, active: boolean) => Promise<void>;
  removeTeacher: (id: string) => Promise<void>;

  // Export
  exportCSV: (entriesToExport?: ScoreEntry[]) => void;
  exportJSON: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, currentUser, role, studentId, defaultDashboardTab } = useAuth();

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('valentes_students_cache');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_STUDENTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('valentes_categories_cache');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CATEGORIES;
  });

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [entries, setEntries] = useState<ScoreEntry[]>([]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('std-1');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Quick Score Update Modal state
  const [isScoreUpdateModalOpen, setIsScoreUpdateModalOpen] = useState<boolean>(false);
  const [targetUpdateStudentId, setTargetUpdateStudentId] = useState<string | null>(null);

  const [liveAlert, setLiveAlert] = useState<LiveNotification | null>(null);
  const [notificationsList, setNotificationsList] = useState<LiveNotification[]>([]);

  // Calculate unambiguous effectiveStudentId
  const effectiveStudentId = useMemo(() => {
    if (role === 'student') {
      // 1. Linked canonical studentId
      if (studentId) return studentId;
      if (userProfile?.studentId) return userProfile.studentId;
      // 2. Fallback to auth UID if new student
      if (currentUser?.uid) return currentUser.uid;
      return '';
    }
    return selectedStudentId;
  }, [role, studentId, userProfile?.studentId, currentUser?.uid, selectedStudentId]);

  const activeStudentId = effectiveStudentId;
  const setActiveStudentId = (id: string) => {
    if (role !== 'student') {
      setSelectedStudentId(id);
    }
  };

  // Network online/offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Automatic redirection based on Firestore role & permissions
  const prevUserRef = React.useRef<string | null>(null);
  useEffect(() => {
    const currentIdentity = userProfile?.id || (currentUser ? currentUser.uid : null);
    if (currentIdentity && currentIdentity !== prevUserRef.current) {
      prevUserRef.current = currentIdentity;
      if (defaultDashboardTab) {
        setActiveTab(defaultDashboardTab as ActiveTab);
      }
    }
  }, [userProfile?.id, currentUser?.uid, defaultDashboardTab]);

  // Frontend route protection: student cannot access teacher/admin tabs
  useEffect(() => {
    if (role === 'student') {
      const forbiddenTabsForStudent: ActiveTab[] = ['admin', 'lancamento', 'lancamento-rapido', 'historico'];
      if (forbiddenTabsForStudent.includes(activeTab)) {
        setActiveTab('minhas-notas');
      }
    } else if (role === 'teacher') {
      if (activeTab === 'admin' && userProfile?.role !== 'admin') {
        setActiveTab('dashboard');
      }
    }
  }, [role, activeTab, userProfile?.role]);

  // Initial Firestore Subscriptions: only executed when currentUser is authenticated
  useEffect(() => {
    if (!currentUser) {
      setIsLoadingData(false);
      return;
    }

    let prevEntryCount = 0;

    // 1. Seed & Subscribe Active Students
    seedInitialStudentsIfEmpty().then((initial) => {
      if (initial && initial.length > 0) {
        setStudents(initial.filter((s) => s.active !== false));
      }
    });
    const unsubStudents = subscribeStudents((list) => {
      if (list.length > 0) setStudents(list);
    });

    // 2. Seed & Subscribe Categories
    seedInitialCategoriesIfEmpty().then((initial) => {
      if (initial && initial.length > 0) setCategories(initial);
    });
    const unsubCategories = subscribeCategories((list) => {
      if (list.length > 0) setCategories(list);
    });

    // 3. Teachers subscription: ONLY if user is teacher or admin and authenticated!
    // Students never subscribe to the users collection per requirement 8.
    let unsubTeachers = () => {};
    if (role !== 'student') {
      seedInitialTeachersIfEmpty().then((initial) => {
        if (initial && initial.length > 0) setTeachers(initial);
      });
      unsubTeachers = subscribeUsers((list) => {
        if (list.length > 0) setTeachers(list);
      });
    }

    // 4. ScoreEntries subscription: Real data only. Artificial seeding disabled per requirement 7.
    const unsubScores = subscribeScoreEntries((list) => {
      if (list.length > prevEntryCount && prevEntryCount > 0) {
        const newest = list[0];
        if (newest) {
          playNotificationChime();
          triggerVibration();
          showSystemNotification(
            '🦁 Ranking dos Valentes: Nova Pontuação',
            `${newest.teacherName} lançou ${newest.points} pts para ${newest.studentName} (${newest.categoryName || 'Geral'})`
          );
          const notif: LiveNotification = {
            id: `notif-${Date.now()}`,
            type: 'score_created',
            message: `${newest.teacherName} lançou ${newest.points} pts para ${newest.studentName}`,
            teacherName: newest.teacherName,
            studentName: newest.studentName,
            studentId: newest.studentId,
            categoryName: newest.categoryName,
            points: newest.points,
            total: newest.points,
            date: newest.date,
            scores: {
              pontualidade: newest.pontualidade ?? 10,
              comportamento: newest.comportamento ?? 10,
              presenca: newest.presenca ?? 10,
              participacao: newest.participacao ?? 10,
              atividade: newest.atividade ?? 10
            },
            timestamp: newest.createdAt,
            forActiveStudent: newest.studentId === effectiveStudentId
          };
          setLiveAlert(notif);
          setNotificationsList((prev) => [notif, ...prev.slice(0, 24)]);
        }
      }
      prevEntryCount = list.length;
      setEntries(list);
      setIsLoadingData(false);
    });

    return () => {
      unsubStudents();
      unsubCategories();
      unsubTeachers();
      unsubScores();
    };
  }, [currentUser, role, effectiveStudentId]);

  // Dismiss liveAlert after 7 seconds
  useEffect(() => {
    if (!liveAlert) return;
    const timer = setTimeout(() => {
      setLiveAlert(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [liveAlert]);

  // Resolve active student: for students, strictly find by effectiveStudentId; no arbitrary fallback
  const activeStudent = useMemo(() => {
    if (role === 'student') {
      return students.find((s) => s.id === effectiveStudentId);
    }
    return students.find((s) => s.id === activeStudentId) || students[0];
  }, [role, students, effectiveStudentId, activeStudentId]);

  // Teacher is strictly identified by the authenticated session
  const activeTeacher = useMemo(() => {
    if (userProfile && (role === 'teacher' || role === 'admin')) {
      return userProfile;
    }
    return teachers[0];
  }, [userProfile, role, teachers]);

  // Real-time explicit sync function
  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      const freshScores = await fetchAllScoreEntriesOnce();
      if (freshScores.length > 0) {
        setEntries(freshScores);
      }
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  }, []);

  // Quick Score Update Modal helper
  const openScoreUpdateModal = useCallback((studentIdToUpdate?: string) => {
    if (studentIdToUpdate) {
      setTargetUpdateStudentId(studentIdToUpdate);
    } else {
      setTargetUpdateStudentId(activeStudentId || null);
    }
    setIsScoreUpdateModalOpen(true);
  }, [activeStudentId]);

  const closeScoreUpdateModal = useCallback(() => {
    setIsScoreUpdateModalOpen(false);
    setTargetUpdateStudentId(null);
  }, []);

  // Actions: Teacher identity is strictly bound to currentUser
  const recordScore = async (data: {
    studentId: string;
    studentName: string;
    points: number;
    categoryId?: string;
    categoryName?: string;
    teacherId?: string;
    teacherName?: string;
    date: string;
    notes?: string;
    pontualidade?: number;
    comportamento?: number;
    presenca?: number;
    participacao?: number;
    atividade?: number;
  }): Promise<ScoreEntry> => {
    const authTeacherId = userProfile?.id || currentUser?.uid || 'prof-anon';
    const authTeacherName = userProfile?.name || currentUser?.displayName || 'Professor';

    const payload = {
      ...data,
      teacherId: authTeacherId,
      teacherName: authTeacherName
    };

    const entry = await createScoreEntryService(payload);
    setEntries((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)]);
    playNotificationChime();
    triggerVibration();
    return entry;
  };

  const recordQuickScores = async (
    items: {
      studentId: string;
      studentName: string;
      points: number;
      categoryId?: string;
      categoryName?: string;
      teacherId?: string;
      teacherName?: string;
      date: string;
      notes?: string;
    }[]
  ): Promise<ScoreEntry[]> => {
    const authTeacherId = userProfile?.id || currentUser?.uid || 'prof-anon';
    const authTeacherName = userProfile?.name || currentUser?.displayName || 'Professor';

    const boundItems = items.map((it) => ({
      ...it,
      teacherId: authTeacherId,
      teacherName: authTeacherName
    }));

    const created = await createBatchScoreEntriesService(boundItems);
    setEntries((prev) => [...created, ...prev]);
    playNotificationChime();
    triggerVibration();
    return created;
  };

  const updateScore = async (id: string, updates: Partial<ScoreEntry>) => {
    await updateScoreEntryService(id, updates);
    const pts = updates.points !== undefined ? updates.points : undefined;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...updates,
              points: pts !== undefined ? pts : e.points,
              total: pts !== undefined ? pts : e.total
            }
          : e
      )
    );
    playNotificationChime();
    triggerVibration();
  };

  const deleteScore = async (id: string) => {
    await deleteScoreEntryService(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Student management
  const createStudent = async (name: string): Promise<Student> => {
    const s = await addStudentService(name);
    setStudents((prev) => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)));
    return s;
  };

  const modifyStudent = async (id: string, updates: Partial<Student>) => {
    await updateStudentService(id, updates);
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeStudent = async (id: string) => {
    await deleteStudentService(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Category management
  const createCategory = async (data: { name: string; description?: string; defaultPoints?: number; iconName?: string }): Promise<Category> => {
    const c = await addCategoryService(data);
    setCategories((prev) => [...prev, c]);
    return c;
  };

  const modifyCategory = async (id: string, updates: Partial<Category>) => {
    await updateCategoryService(id, updates);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeCategory = async (id: string) => {
    await deleteCategoryService(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Teacher management
  const createTeacher = async (data: { name: string; email: string; initialPassword?: string }): Promise<UserProfile> => {
    const newT = await createTeacherUser(data);
    setTeachers((prev) => {
      const exists = prev.some((t) => t.id === newT.id || t.email.toLowerCase() === newT.email.toLowerCase());
      if (exists) return prev.map((t) => (t.id === newT.id ? newT : t));
      return [...prev, newT];
    });
    return newT;
  };

  const modifyTeacherProfile = async (
    id: string,
    data: { name?: string; email?: string; role?: Role; active?: boolean }
  ) => {
    await updateTeacherProfileService(id, data);
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t))
    );
  };

  const modifyTeacherRole = async (id: string, r: Role) => {
    await updateUserRoleService(id, r);
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, role: r } : t)));
  };

  const toggleTeacherActive = async (id: string, active: boolean) => {
    await toggleUserActiveService(id, active);
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, active } : t)));
  };

  const removeTeacher = async (id: string) => {
    await deleteUserService(id);
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  // Export
  const exportCSV = (entriesToExport?: ScoreEntry[]) => {
    const data = entriesToExport || entries;
    const headers = [
      'ID Lançamento',
      'Data',
      'Semana',
      'Mês',
      'Professor',
      'Aluno',
      'Categoria',
      'Pontos',
      'Observações',
      'Data/Hora Registro'
    ];

    const rows = data.map((e) => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.week}"`,
      `"${e.monthLabel || e.month}"`,
      `"${e.teacherName}"`,
      `"${e.studentName}"`,
      `"${e.categoryName || 'Geral'}"`,
      e.points !== undefined ? e.points : ((e as any).total || 0),
      `"${e.notes || ''}"`,
      `"${e.createdAt}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking-dos-valentes-lancamentos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      students,
      categories,
      teachers,
      entries
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-ranking-dos-valentes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppContext.Provider
      value={{
        students,
        teachers,
        categories,
        entries,
        activeTab,
        setActiveTab,
        effectiveStudentId,
        activeStudentId,
        setActiveStudentId,
        activeStudent,
        activeTeacher,
        isOnline,
        serverOnline: isOnline,
        isLoadingData,
        liveAlert,
        notificationsList,
        clearLiveAlert: () => setLiveAlert(null),
        userRole: role,
        syncNow,
        isSyncing,
        isScoreUpdateModalOpen,
        targetUpdateStudentId,
        openScoreUpdateModal,
        closeScoreUpdateModal,
        recordScore,
        recordQuickScores,
        updateScore,
        deleteScore,
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
        exportJSON
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
