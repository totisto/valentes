import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Runtime Environment Constraint: Dev server must run on port 3000
const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'valentes-db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial students
const INITIAL_STUDENTS_NAMES = [
  'Beatriz', 'Damares', 'Davi', 'Denis', 'Eduardo', 'Franciele',
  'Gabriel', 'Guilherme', 'Hadassa', 'Iam', 'Isac', 'Jhon',
  'João', 'Liardson', 'Lucas', 'Miguel', 'Naira', 'Pedro',
  'Pietro', 'Samuel', 'Vanessa'
];

const INITIAL_STUDENTS = INITIAL_STUDENTS_NAMES.map((name, index) => ({
  id: `std-${index + 1}`,
  name,
  active: true,
  avatarSeed: name.toLowerCase()
}));

const INITIAL_TEACHERS = [
  { id: 'prof-1', name: 'Prof. Marcos Silva', role: 'coordenador', avatarSeed: 'marcos' },
  { id: 'prof-2', name: 'Profª. Camila Santos', role: 'professor', avatarSeed: 'camila' },
  { id: 'prof-3', name: 'Prof. Thiago Rocha', role: 'professor', avatarSeed: 'thiago' },
  { id: 'prof-4', name: 'Profª. Renata Lima', role: 'professor', avatarSeed: 'renata' }
];

function getISOWeekInfo(date: Date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = date.getFullYear();

  const monday = new Date(date);
  monday.setDate(date.getDate() - dayNr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatShort = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = `${monthNames[date.getMonth()]} de ${year}`;
  const weekLabel = `Semana ${weekNumber} (${formatShort(monday)} a ${formatShort(sunday)})`;

  return { weekNumber, year, weekLabel, monthKey, monthLabel };
}

function generateInitialSeed(students: any[], teachers: any[]) {
  const entries: any[] = [];
  const today = new Date();

  const studentTargetPoints: Record<string, number> = {
    'Isac': 432,
    'Franciele': 420,
    'Hadassa': 385,
    'Davi': 375,
    'Lucas': 368,
    'Beatriz': 360,
    'Miguel': 352,
    'Gabriel': 345,
    'Samuel': 340,
    'Vanessa': 335,
    'João': 328,
    'Pedro': 320,
    'Eduardo': 315,
    'Guilherme': 310,
    'Pietro': 300,
    'Naira': 295,
    'Damares': 290,
    'Denis': 285,
    'Jhon': 275,
    'Liardson': 260,
    'Iam': 250
  };

  const dayOffsets = [0, -1, -2, -3, -4, -5, -6, -7, -8];

  students.forEach((student, sIdx) => {
    const target = studentTargetPoints[student.name] || 300;
    const averagePerDay = target / dayOffsets.length;

    dayOffsets.forEach((dayOffset, dIdx) => {
      const entryDate = new Date(today);
      entryDate.setDate(today.getDate() + dayOffset);
      const dateStr = entryDate.toISOString().slice(0, 10);
      const weekInfo = getISOWeekInfo(entryDate);
      const teacher = teachers[(sIdx + dIdx) % teachers.length];

      const variation = ((sIdx * 3 + dIdx * 7) % 5) - 2;
      const dayTotalTarget = Math.min(50, Math.max(20, Math.round(averagePerDay + variation)));

      let remaining = dayTotalTarget;
      const pontualidade = Math.min(10, Math.max(4, Math.round(remaining / 5 + (dIdx % 2))));
      remaining -= pontualidade;
      const comportamento = Math.min(10, Math.max(4, Math.round(remaining / 4 + ((dIdx + 1) % 2))));
      remaining -= comportamento;
      const presenca = Math.min(10, Math.max(5, Math.round(remaining / 3)));
      remaining -= presenca;
      const participacao = Math.min(10, Math.max(3, Math.round(remaining / 2)));
      remaining -= participacao;
      const atividade = Math.min(10, Math.max(2, remaining));
      const total = pontualidade + comportamento + presenca + participacao + atividade;

      const timeHour = 9 + (dIdx % 8);
      const timeMin = (sIdx * 3) % 60;
      const entryTime = `${String(timeHour).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}:00`;

      entries.push({
        id: `VAL-${dateStr.replace(/-/g, '')}-${student.id}-${dIdx + 1}`,
        date: dateStr,
        month: weekInfo.monthKey,
        monthLabel: weekInfo.monthLabel,
        week: weekInfo.weekLabel,
        weekNumber: weekInfo.weekNumber,
        year: weekInfo.year,
        teacherId: teacher.id,
        teacherName: teacher.name,
        studentId: student.id,
        studentName: student.name,
        pontualidade,
        comportamento,
        presenca,
        participacao,
        atividade,
        total,
        createdAt: `${dateStr}T${entryTime}Z`
      });
    });
  });

  return entries;
}

// Database helper
interface DatabaseSchema {
  students: any[];
  teachers: any[];
  entries: any[];
  updatedAt: string;
}

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.students) && Array.isArray(parsed.entries)) {
        return parsed;
      }
    } catch (err) {
      console.error('Failed to parse database file, reinitializing', err);
    }
  }

  const initialData: DatabaseSchema = {
    students: INITIAL_STUDENTS,
    teachers: INITIAL_TEACHERS,
    entries: generateInitialSeed(INITIAL_STUDENTS, INITIAL_TEACHERS),
    updatedAt: new Date().toISOString()
  };

  saveDatabase(initialData);
  return initialData;
}

const BACKUP_DIR = path.resolve(DATA_DIR, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function saveDatabase(data: DatabaseSchema) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');

  // Save daily snapshot to guarantee daily history preservation
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dailyFile = path.resolve(BACKUP_DIR, `valentes-snapshot-${todayStr}.json`);
    fs.writeFileSync(dailyFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write daily snapshot:', err);
  }
}

let db = loadDatabase();

// Connected clients for real-time live synchronization
const sseClients = new Set<express.Response>();

function broadcastEvent(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, timestamp: new Date().toISOString(), ...payload });
  sseClients.forEach(res => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(res);
    }
  });
}

// Keep-alive heartbeat every 20 seconds
setInterval(() => {
  broadcastEvent('ping', { time: Date.now() });
}, 20000);

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Real-Time Server-Sent Events (SSE) Stream
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get all data
  app.get('/api/data', (req, res) => {
    res.json(db);
  });

  // Create new score entry
  app.post('/api/entries', (req, res) => {
    const { date, teacherId, studentId, scores, notes } = req.body;

    const student = db.students.find(s => s.id === studentId);
    const teacher = db.teachers.find(t => t.id === teacherId);

    if (!student || !teacher) {
      return res.status(400).json({ error: 'Aluno ou Professor não encontrado' });
    }

    const pontualidade = Math.min(10, Math.max(0, Math.round(Number(scores?.pontualidade) || 0)));
    const comportamento = Math.min(10, Math.max(0, Math.round(Number(scores?.comportamento) || 0)));
    const presenca = Math.min(10, Math.max(0, Math.round(Number(scores?.presenca) || 0)));
    const participacao = Math.min(10, Math.max(0, Math.round(Number(scores?.participacao) || 0)));
    const atividade = Math.min(10, Math.max(0, Math.round(Number(scores?.atividade) || 0)));
    const total = pontualidade + comportamento + presenca + participacao + atividade;

    const dateObj = new Date(date + 'T12:00:00');
    const weekInfo = getISOWeekInfo(dateObj);
    const nowIso = new Date().toISOString();

    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const id = `VAL-${date.replace(/-/g, '')}-${randomPart}`;

    const newEntry = {
      id,
      date,
      month: weekInfo.monthKey,
      monthLabel: weekInfo.monthLabel,
      week: weekInfo.weekLabel,
      weekNumber: weekInfo.weekNumber,
      year: weekInfo.year,
      teacherId,
      teacherName: teacher.name,
      studentId,
      studentName: student.name,
      pontualidade,
      comportamento,
      presenca,
      participacao,
      atividade,
      total,
      createdAt: nowIso,
      notes: notes?.trim() || undefined
    };

    db.entries.unshift(newEntry);
    saveDatabase(db);

    // Broadcast in real-time to all connected devices
    broadcastEvent('score_created', {
      entry: newEntry,
      teacherName: teacher.name,
      studentName: student.name,
      total: newEntry.total,
      message: `${teacher.name} registrou nova pontuação para ${student.name} (${newEntry.total} pts)`
    });

    res.status(201).json(newEntry);
  });

  // Update entry
  app.put('/api/entries/:id', (req, res) => {
    const { id } = req.params;
    const entryIndex = db.entries.findIndex(e => e.id === id);

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    const existing = db.entries[entryIndex];
    const updates = req.body;

    const pontualidade = updates.pontualidade !== undefined
      ? Math.min(10, Math.max(0, Math.round(Number(updates.pontualidade) || 0)))
      : existing.pontualidade;
    const comportamento = updates.comportamento !== undefined
      ? Math.min(10, Math.max(0, Math.round(Number(updates.comportamento) || 0)))
      : existing.comportamento;
    const presenca = updates.presenca !== undefined
      ? Math.min(10, Math.max(0, Math.round(Number(updates.presenca) || 0)))
      : existing.presenca;
    const participacao = updates.participacao !== undefined
      ? Math.min(10, Math.max(0, Math.round(Number(updates.participacao) || 0)))
      : existing.participacao;
    const atividade = updates.atividade !== undefined
      ? Math.min(10, Math.max(0, Math.round(Number(updates.atividade) || 0)))
      : existing.atividade;

    const total = pontualidade + comportamento + presenca + participacao + atividade;

    let date = updates.date || existing.date;
    let weekInfo = getISOWeekInfo(new Date(date + 'T12:00:00'));

    let teacherName = existing.teacherName;
    if (updates.teacherId) {
      const foundT = db.teachers.find(t => t.id === updates.teacherId);
      if (foundT) teacherName = foundT.name;
    }

    let studentName = existing.studentName;
    if (updates.studentId) {
      const foundS = db.students.find(s => s.id === updates.studentId);
      if (foundS) studentName = foundS.name;
    }

    const updatedEntry = {
      ...existing,
      ...updates,
      date,
      month: weekInfo.monthKey,
      monthLabel: weekInfo.monthLabel,
      week: weekInfo.weekLabel,
      weekNumber: weekInfo.weekNumber,
      year: weekInfo.year,
      teacherName,
      studentName,
      pontualidade,
      comportamento,
      presenca,
      participacao,
      atividade,
      total,
      updatedAt: new Date().toISOString()
    };

    db.entries[entryIndex] = updatedEntry;
    saveDatabase(db);

    // Broadcast update in real-time
    broadcastEvent('score_updated', {
      entry: updatedEntry,
      teacherName,
      studentName,
      total,
      message: `${teacherName} atualizou a pontuação de ${studentName} para ${total} pts`
    });

    res.json(updatedEntry);
  });

  // Delete entry
  app.delete('/api/entries/:id', (req, res) => {
    const { id } = req.params;
    const deletedEntry = db.entries.find(e => e.id === id);
    db.entries = db.entries.filter(e => e.id !== id);
    saveDatabase(db);

    broadcastEvent('score_deleted', {
      id,
      studentName: deletedEntry?.studentName,
      message: `Lançamento de ${deletedEntry?.studentName || 'aluno'} foi removido`
    });

    res.json({ success: true });
  });

  // Add student
  app.post('/api/students', (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome do aluno é obrigatório' });
    }
    const newStudent = {
      id: `std-${Date.now()}`,
      name: name.trim(),
      active: true,
      avatarSeed: name.trim().toLowerCase()
    };
    db.students.push(newStudent);
    db.students.sort((a, b) => a.name.localeCompare(b.name));
    saveDatabase(db);

    broadcastEvent('student_added', { student: newStudent, message: `Novo aluno adicionado: ${newStudent.name}` });
    res.status(201).json(newStudent);
  });

  // Remove student
  app.delete('/api/students/:id', (req, res) => {
    const { id } = req.params;
    db.students = db.students.filter(s => s.id !== id);
    saveDatabase(db);

    broadcastEvent('student_removed', { id, message: 'Aluno removido do sistema' });
    res.json({ success: true });
  });

  // Add teacher
  app.post('/api/teachers', (req, res) => {
    const { name, role } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome do professor é obrigatório' });
    }
    const newTeacher = {
      id: `prof-${Date.now()}`,
      name: name.trim(),
      role: role === 'coordenador' ? 'coordenador' : 'professor',
      avatarSeed: name.trim().toLowerCase()
    };
    db.teachers.push(newTeacher);
    saveDatabase(db);

    broadcastEvent('teacher_added', { teacher: newTeacher, message: `Novo professor cadastrado: ${newTeacher.name}` });
    res.status(201).json(newTeacher);
  });

  // Remove teacher
  app.delete('/api/teachers/:id', (req, res) => {
    const { id } = req.params;
    if (db.teachers.length <= 1) {
      return res.status(400).json({ error: 'Deve haver pelo menos 1 professor' });
    }
    db.teachers = db.teachers.filter(t => t.id !== id);
    saveDatabase(db);

    broadcastEvent('teacher_removed', { id, message: 'Professor removido' });
    res.json({ success: true });
  });

  // Reset database to initial seed
  app.post('/api/reset', (req, res) => {
    db = {
      students: INITIAL_STUDENTS,
      teachers: INITIAL_TEACHERS,
      entries: generateInitialSeed(INITIAL_STUDENTS, INITIAL_TEACHERS),
      updatedAt: new Date().toISOString()
    };
    saveDatabase(db);

    broadcastEvent('db_reloaded', { db, message: 'Banco de dados restaurado para padrão inicial' });
    res.json(db);
  });

  // Import full JSON backup
  app.post('/api/import', (req, res) => {
    const { students, teachers, entries } = req.body;
    if (Array.isArray(students) && Array.isArray(entries)) {
      db.students = students;
      if (Array.isArray(teachers) && teachers.length > 0) {
        db.teachers = teachers;
      }
      db.entries = entries;
      saveDatabase(db);

      broadcastEvent('db_reloaded', { db, message: 'Backup importado com sucesso' });
      return res.json({ success: true, db });
    }
    res.status(400).json({ error: 'Formato de backup inválido' });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
