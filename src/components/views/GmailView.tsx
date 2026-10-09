import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  isGmailConnected,
  fetchGmailProfile,
  listGmailMessages,
  getGmailMessageDetail,
  sendGmailEmail,
  saveGmailDraft,
  trashGmailMessage,
  GmailProfile,
  GmailMessageSummary,
  GmailMessageDetail
} from '../../services/gmailService';
import {
  Mail,
  Send,
  Inbox,
  FileText,
  Trash2,
  RotateCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  User,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
  ChevronRight,
  PlusCircle,
  Paperclip,
  Clock,
  Award,
  Filter
} from 'lucide-react';

interface SendConfirmationData {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export const GmailView: React.FC = () => {
  const {
    currentUser,
    userProfile,
    role,
    isGmailConnected: connectedState,
    connectGmailAccount,
    disconnectGmailAccount
  } = useAuth();
  const { students, entries } = useApp();

  const [connected, setConnected] = useState<boolean>(isGmailConnected());
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'SENT' | 'DRAFT'>('INBOX');
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Composer State
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [composerTo, setComposerTo] = useState<string>('');
  const [composerSubject, setComposerSubject] = useState<string>('');
  const [composerBody, setComposerBody] = useState<string>('');
  const [composerCc, setComposerCc] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // User Confirmation Modal State (Mandatory for destructive/sending operations)
  const [confirmationData, setConfirmationData] = useState<SendConfirmationData | null>(null);
  const [trashConfirmationId, setTrashConfirmationId] = useState<string | null>(null);

  // Sync connected status
  useEffect(() => {
    setConnected(isGmailConnected() || connectedState);
  }, [connectedState]);

  // Load profile and messages when connected
  useEffect(() => {
    if (connected) {
      loadProfileAndMessages();
    }
  }, [connected, activeFolder]);

  const loadProfileAndMessages = async () => {
    setIsLoadingMessages(true);
    setStatusFeedback(null);
    try {
      const p = await fetchGmailProfile();
      setProfile(p);

      const labelMap = {
        INBOX: ['INBOX'],
        SENT: ['SENT'],
        DRAFT: ['DRAFT']
      };

      const res = await listGmailMessages({
        maxResults: 15,
        labelIds: labelMap[activeFolder],
        q: searchQuery.trim() || undefined
      });
      setMessages(res.messages);
    } catch (err: any) {
      console.warn('Erro ao carregar mensagens:', err);
      if (err.message?.includes('expirada') || err.message?.includes('não conectado')) {
        setConnected(false);
      }
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Não foi possível carregar as mensagens do Gmail.'
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleConnect = async () => {
    setStatusFeedback({ type: 'info', message: 'Conectando à sua conta do Google...' });
    try {
      const ok = await connectGmailAccount();
      if (ok) {
        setConnected(true);
        setStatusFeedback({ type: 'success', message: 'Gmail conectado com sucesso!' });
        loadProfileAndMessages();
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Falha ao autorizar acesso ao Gmail.'
      });
    }
  };

  const handleDisconnect = () => {
    disconnectGmailAccount();
    setConnected(false);
    setProfile(null);
    setMessages([]);
    setSelectedMessage(null);
    setStatusFeedback({ type: 'info', message: 'Conta do Gmail desconectada.' });
  };

  const handleOpenMessage = async (msg: GmailMessageSummary) => {
    setIsLoadingDetail(true);
    setStatusFeedback(null);
    try {
      const detail = await getGmailMessageDetail(msg.id);
      setSelectedMessage(detail);
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: 'Falha ao abrir conteúdo completo da mensagem.'
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Pre-fill school communication templates
  const applyTemplate = (templateKey: string, studentId?: string) => {
    const sId = studentId || selectedStudentId;
    const targetStudent = students.find((s) => s.id === sId) || students[0];
    const studentName = targetStudent ? targetStudent.name : 'Aluno';
    const studentEmail = targetStudent?.email || (targetStudent ? `${targetStudent.name.toLowerCase().replace(/\s+/g, '.')}@escola.com` : '');

    if (studentEmail && !composerTo) {
      setComposerTo(studentEmail);
    }

    const studentEntries = entries.filter((e) => e.studentId === targetStudent?.id);
    const monthPoints = studentEntries.reduce((sum, e) => sum + (e.points || e.total || 0), 0);
    const weekPoints = studentEntries.slice(-5).reduce((sum, e) => sum + (e.points || e.total || 0), 0);
    const weekPos = 1;

    switch (templateKey) {
      case 'ranking_update':
        setComposerSubject(`[Valentes] Relatório de Desempenho e Pontuação · ${studentName}`);
        setComposerBody(`
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; color: #fbbf24;">VALENTES · BOLETIM OFICIAL</h1>
    <p style="margin: 4px 0 0 0; font-size: 14px; color: #93c5fd;">Atualização Semanal de Pontuação e Participação</p>
  </div>
  <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Olá, <strong>${studentName}</strong> e responsáveis,</p>
    <p>Seguem as informações atualizadas de desempenho no projeto <strong>Valentes</strong>:</p>
    
    <div style="background: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Pontuação da Semana:</strong> <span style="color: #b45309; font-size: 18px; font-weight: bold;">${weekPoints} pontos</span></p>
      <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Posição no Ranking Semanal:</strong> <span style="color: #1e3a8a; font-weight: bold;">${weekPos > 0 ? `${weekPos}º Lugar` : 'Classificado'}</span></p>
      <p style="margin: 0; font-size: 15px;"><strong>Pontos Totais no Mês:</strong> <span style="font-weight: bold;">${monthPoints} pontos</span></p>
    </div>

    <p>Parabéns pela dedicação e esforço demonstrados nesta etapa! Continuem firmes em direção aos objetivos do grupo.</p>
    <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
      Atenciosamente,<br>
      <strong>${userProfile?.name || 'Coordenação Pedagógica dos Valentes'}</strong><br>
      Sistema de Pontuação dos Valentes
    </p>
  </div>
</div>
        `.trim());
        break;

      case 'praise':
        setComposerSubject(`[Valentes] Parabéns pelo Excelente Desempenho e Postura · ${studentName}`);
        setComposerBody(`
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
  <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 24px; color: #a7f3d0;">ELOGIO POR DESTAQUE</h1>
    <p style="margin: 4px 0 0 0; font-size: 14px; color: #d1fae5;">Reconhecimento Especial dos Professores</p>
  </div>
  <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Prezado(a) <strong>${studentName}</strong> e família,</p>
    <p>Gostaríamos de registrar publicamente nosso reconhecimento pela postura exemplar, pontualidade e excelente dedicação às atividades pedagógicas do grupo <strong>Valentes</strong>.</p>
    <p>Sua liderança positiva e respeito aos colegas fazem toda a diferença para o nosso ambiente escolar.</p>
    <p>Continue sendo uma referência de honra, disciplina e dedicação!</p>
    <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
      Com estima e admiração,<br>
      <strong>${userProfile?.name || 'Corpo Docente'}</strong>
    </p>
  </div>
</div>
        `.trim());
        break;

      case 'attendance_alert':
        setComposerSubject(`[Valentes] Alerta de Frequência e Pontualidade · ${studentName}`);
        setComposerBody(`
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
  <div style="background: linear-gradient(135deg, #991b1b 0%, #b91c1c 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 22px; color: #fecaca;">COMUNICADO DE ATENÇÃO</h1>
    <p style="margin: 4px 0 0 0; font-size: 14px; color: #fee2e2;">Frequência e Pontualidade nas Aulas</p>
  </div>
  <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Prezados responsáveis por <strong>${studentName}</strong>,</p>
    <p>Entramos em contato para conversar sobre a importância da pontualidade e assiduidade nos encontros da turma dos <strong>Valentes</strong>.</p>
    <p>Notamos ausências ou atrasos recentes que estão impactando a pontuação semanal e o acompanhamento das atividades.</p>
    <p>Solicitamos a gentileza de nos responder este e-mail caso haja algum motivo de saúde ou imprevisto, para que possamos prestar todo o suporte necessário.</p>
    <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
      Atenciosamente,<br>
      <strong>${userProfile?.name || 'Coordenação dos Valentes'}</strong>
    </p>
  </div>
</div>
        `.trim());
        break;

      case 'general_notice':
        setComposerSubject(`[Valentes] Comunicado Oficial para a Turma`);
        setComposerBody(`
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
  <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 22px; color: #fbbf24;">COMUNICADO GERAL · TURMA DOS VALENTES</h1>
  </div>
  <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Prezados alunos e responsáveis,</p>
    <p>Informamos que teremos uma atividade especial na próxima sessão. Pedimos que todos estejam atentos aos horários e tragam seus materiais completos para garantir os pontos de pontualidade e participação.</p>
    <p>Agradecemos a colaboração de todas as famílias!</p>
    <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
      Atenciosamente,<br>
      <strong>${userProfile?.name || 'Professores Valentes'}</strong>
    </p>
  </div>
</div>
        `.trim());
        break;
      default:
        break;
    }
    setSelectedTemplate(templateKey);
  };

  // Step 1: User clicks "Enviar" -> Prepares confirmation dialog
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerTo.trim() || !composerSubject.trim() || !composerBody.trim()) {
      setStatusFeedback({
        type: 'error',
        message: 'Preencha o destinatário, assunto e mensagem antes de prosseguir.'
      });
      return;
    }

    // MANDATORY CONFIRMATION DIALOG (Workspace Integration Skill Requirement)
    setConfirmationData({
      to: composerTo.trim(),
      subject: composerSubject.trim(),
      body: composerBody.trim(),
      cc: composerCc.trim() || undefined
    });
  };

  // Step 2: User confirms explicitly in the modal
  const handleConfirmSend = async () => {
    if (!confirmationData) return;
    setIsSending(true);
    setStatusFeedback(null);
    try {
      await sendGmailEmail({
        to: confirmationData.to,
        subject: confirmationData.subject,
        body: confirmationData.body,
        cc: confirmationData.cc
      });

      setStatusFeedback({
        type: 'success',
        message: `E-mail enviado com sucesso para ${confirmationData.to} via Gmail!`
      });

      setConfirmationData(null);
      setIsComposerOpen(false);
      setComposerTo('');
      setComposerSubject('');
      setComposerBody('');
      setComposerCc('');
      setSelectedTemplate('');

      // Refresh sent items
      if (activeFolder === 'SENT') {
        loadProfileAndMessages();
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Falha ao enviar e-mail pelo Gmail.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!composerTo.trim() && !composerSubject.trim()) {
      setStatusFeedback({ type: 'error', message: 'Preencha ao menos o assunto ou destinatário para salvar o rascunho.' });
      return;
    }
    setIsSending(true);
    try {
      await saveGmailDraft({
        to: composerTo.trim(),
        subject: composerSubject.trim() || '(Rascunho sem assunto)',
        body: composerBody.trim()
      });
      setStatusFeedback({ type: 'success', message: 'Rascunho salvo no seu Gmail!' });
      setIsComposerOpen(false);
      if (activeFolder === 'DRAFT') {
        loadProfileAndMessages();
      }
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Erro ao salvar rascunho.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmTrash = async () => {
    if (!trashConfirmationId) return;
    try {
      await trashGmailMessage(trashConfirmationId);
      setStatusFeedback({ type: 'success', message: 'Mensagem movida para a lixeira do Gmail.' });
      setTrashConfirmationId(null);
      setSelectedMessage(null);
      loadProfileAndMessages();
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Erro ao mover para a lixeira.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-24 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0B192C] via-[#0E2749] to-[#0B192C] p-5 sm:p-6 rounded-3xl border border-blue-900/60 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-blue-500 p-0.5 shadow-lg shadow-rose-500/20 flex-shrink-0">
            <div className="w-full h-full bg-[#081220] rounded-[14px] flex items-center justify-center">
              <Mail className="w-7 h-7 text-rose-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-['Teko',sans-serif] leading-tight">
                Gmail para Valentes
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Google Workspace
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-200/80 font-medium">
              Envie comunicados, boletins de pontuação e mensagens oficiais direto da sua conta Gmail.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {connected ? (
            <>
              <button
                onClick={() => {
                  setIsComposerOpen(true);
                  if (students.length > 0 && !selectedStudentId) {
                    setSelectedStudentId(students[0].id);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Novo E-mail</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-400 text-xs font-semibold transition-all cursor-pointer"
                title="Desconectar do Gmail"
              >
                Desconectar
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="gsi-material-button flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span>Conectar com o Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Feedback Alert */}
      {statusFeedback && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold border ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : statusFeedback.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
              : 'bg-blue-950/80 border-blue-500/50 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : statusFeedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <RotateCw className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
            )}
            <span>{statusFeedback.message}</span>
          </div>
          <button
            onClick={() => setStatusFeedback(null)}
            className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* When NOT connected: Clean Google Auth Presentation */}
      {!connected ? (
        <div className="bg-[#0B192C] rounded-3xl border border-blue-900/50 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 via-amber-500 to-blue-500 p-1 shadow-xl shadow-rose-500/20">
            <div className="w-full h-full bg-[#081220] rounded-[22px] flex items-center justify-center">
              <Mail className="w-10 h-10 text-rose-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-['Teko',sans-serif]">
              Conecte sua conta do Gmail
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Ao conectar sua conta Google com permissão do usuário, você poderá disparar mensagens oficiais para os 21 Valentes, notificar os pais sobre pontuação e consultar mensagens recebidas com segurança.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-800/40 text-left space-y-2 max-w-md mx-auto text-xs text-blue-200/90">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Permissões Seguras e Transparentes:</span>
            </div>
            <ul className="space-y-1 pl-5 list-disc text-[11px] text-slate-300">
              <li>Envio de e-mails de feedback e notas aos alunos e responsáveis</li>
              <li>Criação de rascunhos de comunicados escolares</li>
              <li>Confirmação explícita obrigatória antes de cada envio</li>
              <li>Token seguro em memória (sem armazenamento em cookies ou storage local)</li>
            </ul>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleConnect}
              className="gsi-material-button inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-xl hover:shadow-2xl transition-all active:scale-95 cursor-pointer"
            >
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6 block">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span>Autorizar Gmail com o Google</span>
            </button>
          </div>
        </div>
      ) : (
        /* Connected Interface: Folder navigation, Mail list, Quick communication bar */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Folders & Account Information */}
          <div className="lg:col-span-4 space-y-4">
            {/* Account Card */}
            <div className="bg-[#0B192C] p-4 rounded-3xl border border-blue-900/50 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 font-bold">
                  {(profile?.emailAddress || currentUser?.email || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {profile?.emailAddress || currentUser?.email}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Conectado ao Gmail</span>
                  </div>
                </div>
              </div>

              {profile && (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-blue-900/40 text-center">
                  <div className="p-2 rounded-xl bg-blue-950/40">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Mensagens</div>
                    <div className="text-sm font-extrabold text-amber-300">{profile.messagesTotal.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-950/40">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Conversas</div>
                    <div className="text-sm font-extrabold text-slate-100">{profile.threadsTotal.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Folder Tabs */}
            <div className="bg-[#0B192C] p-2 rounded-3xl border border-blue-900/50 shadow-md space-y-1">
              <button
                onClick={() => {
                  setActiveFolder('INBOX');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeFolder === 'INBOX'
                    ? 'bg-blue-900/70 text-amber-300 border border-blue-700/60 shadow-sm'
                    : 'text-slate-300 hover:bg-blue-950/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-blue-400" />
                  <span>Caixa de Entrada</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  Inbox
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveFolder('SENT');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeFolder === 'SENT'
                    ? 'bg-blue-900/70 text-amber-300 border border-blue-700/60 shadow-sm'
                    : 'text-slate-300 hover:bg-blue-950/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Enviados</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-slate-400">
                  Sent
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveFolder('DRAFT');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeFolder === 'DRAFT'
                    ? 'bg-blue-900/70 text-amber-300 border border-blue-700/60 shadow-sm'
                    : 'text-slate-300 hover:bg-blue-950/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Rascunhos</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-slate-400">
                  Drafts
                </span>
              </button>
            </div>

            {/* Quick Communicator for Teachers */}
            <div className="bg-[#0B192C] p-4 rounded-3xl border border-blue-900/50 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Atalhos Rápidos de Comunicado</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Modelos prontos para notificar alunos e famílias com 1 clique:
              </p>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setIsComposerOpen(true);
                    applyTemplate('ranking_update');
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-blue-950/50 hover:bg-blue-900/40 border border-blue-800/40 hover:border-amber-400 text-xs font-semibold text-slate-200 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">📊 Boletim Semanal com Pontos</span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
                <button
                  onClick={() => {
                    setIsComposerOpen(true);
                    applyTemplate('praise');
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-blue-950/50 hover:bg-blue-900/40 border border-blue-800/40 hover:border-emerald-400 text-xs font-semibold text-slate-200 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">⭐ Elogio por Postura Exemplar</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
                <button
                  onClick={() => {
                    setIsComposerOpen(true);
                    applyTemplate('attendance_alert');
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-blue-950/50 hover:bg-blue-900/40 border border-blue-800/40 hover:border-rose-400 text-xs font-semibold text-slate-200 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">⏰ Alerta de Pontualidade / Frequência</span>
                  <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
                </button>
                <button
                  onClick={() => {
                    setIsComposerOpen(true);
                    applyTemplate('general_notice');
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-blue-950/50 hover:bg-blue-900/40 border border-blue-800/40 hover:border-blue-400 text-xs font-semibold text-slate-200 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">📢 Comunicado Geral para a Turma</span>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Search, Message list & Message reader */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search and Refresh Bar */}
            <div className="bg-[#0B192C] p-3 rounded-2xl border border-blue-900/50 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar mensagens no Gmail (assunto, remetente)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadProfileAndMessages();
                  }}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-800/60 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                onClick={loadProfileAndMessages}
                disabled={isLoadingMessages}
                className="p-2 rounded-xl bg-blue-950/80 border border-blue-800/70 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                title="Recarregar mensagens"
              >
                <RotateCw className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>

            {/* If a message is selected, show detail view */}
            {selectedMessage ? (
              <div className="bg-[#0B192C] rounded-3xl border border-blue-900/60 p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                  >
                    <span>← Voltar para lista</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTrashConfirmationId(selectedMessage.id)}
                      className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/50 hover:border-rose-400 text-rose-300 transition-all cursor-pointer"
                      title="Mover para lixeira"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsComposerOpen(true);
                        setComposerTo(selectedMessage.from.match(/<([^>]+)>/)?.[1] || selectedMessage.from);
                        setComposerSubject(`Re: ${selectedMessage.subject}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Responder</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">{selectedMessage.subject}</h3>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400">De: </span>
                      <strong className="text-amber-300">{selectedMessage.from}</strong>
                    </div>
                    <div className="text-slate-400">{selectedMessage.date}</div>
                  </div>
                  {selectedMessage.to && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      Para: <span>{selectedMessage.to}</span>
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 rounded-2xl bg-[#081220] border border-blue-900/40 min-h-[220px] max-h-[500px] overflow-y-auto text-sm text-slate-200">
                  {selectedMessage.bodyHtml ? (
                    <div
                      className="prose prose-invert max-w-none text-slate-200"
                      dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                    />
                  ) : (
                    <pre className="font-sans whitespace-pre-wrap text-slate-200">
                      {selectedMessage.bodyText || selectedMessage.snippet}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              /* Message List */
              <div className="bg-[#0B192C] rounded-3xl border border-blue-900/50 overflow-hidden shadow-xl">
                <div className="px-5 py-3.5 border-b border-blue-900/40 flex items-center justify-between bg-blue-950/30">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>
                      {activeFolder === 'INBOX'
                        ? 'Caixa de Entrada'
                        : activeFolder === 'SENT'
                        ? 'Mensagens Enviadas'
                        : 'Rascunhos'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}
                  </span>
                </div>

                {isLoadingMessages ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                    <RotateCw className="w-7 h-7 text-amber-400 animate-spin" />
                    <span className="text-xs font-bold">Carregando e-mails do Gmail...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">Nenhuma mensagem encontrada nesta pasta.</p>
                    <p className="text-xs text-slate-500">
                      Envie um comunicado aos alunos clicando em "Novo E-mail".
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-blue-900/30">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => handleOpenMessage(msg)}
                        className={`p-4 hover:bg-blue-950/50 transition-all cursor-pointer flex items-start gap-3 ${
                          msg.isUnread ? 'bg-blue-950/30 font-semibold' : ''
                        }`}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {msg.isUnread ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block shadow-sm shadow-amber-400/50" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 block" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-200 truncate max-w-[200px] sm:max-w-[300px]">
                              {activeFolder === 'SENT' ? `Para: ${msg.to || '(Sem destinatário)'}` : msg.from}
                            </span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {msg.date.split(' ').slice(0, 4).join(' ')}
                            </span>
                          </div>

                          <div className="text-sm font-bold text-white truncate">{msg.subject}</div>

                          <p className="text-xs text-slate-400 truncate">{msg.snippet}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPOSER MODAL */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0B192C] border border-blue-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-blue-900/60 flex items-center justify-between bg-blue-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-['Teko',sans-serif]">
                    Novo E-mail · Comunicado Escolar
                  </h3>
                  <p className="text-[11px] text-blue-200/80">Enviado com sua conta Gmail oficial</p>
                </div>
              </div>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-blue-900/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleInitiateSend} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Template Quick Selection */}
              <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Preencher com Modelo Escolar:</span>
                  </span>
                  {selectedTemplate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplate('');
                        setComposerSubject('');
                        setComposerBody('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-300 cursor-pointer"
                    >
                      Limpar modelo
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTemplate('ranking_update')}
                    className={`p-2 rounded-xl text-[10px] font-bold text-center border transition-all cursor-pointer ${
                      selectedTemplate === 'ranking_update'
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-blue-900/40 text-slate-200 border-blue-800/40 hover:border-amber-400'
                    }`}
                  >
                    📊 Boletim Pontos
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('praise')}
                    className={`p-2 rounded-xl text-[10px] font-bold text-center border transition-all cursor-pointer ${
                      selectedTemplate === 'praise'
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                        : 'bg-blue-900/40 text-slate-200 border-blue-800/40 hover:border-emerald-400'
                    }`}
                  >
                    ⭐ Elogio
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('attendance_alert')}
                    className={`p-2 rounded-xl text-[10px] font-bold text-center border transition-all cursor-pointer ${
                      selectedTemplate === 'attendance_alert'
                        ? 'bg-rose-400 text-slate-950 border-rose-300'
                        : 'bg-blue-900/40 text-slate-200 border-blue-800/40 hover:border-rose-400'
                    }`}
                  >
                    ⏰ Alerta Atraso
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('general_notice')}
                    className={`p-2 rounded-xl text-[10px] font-bold text-center border transition-all cursor-pointer ${
                      selectedTemplate === 'general_notice'
                        ? 'bg-blue-400 text-slate-950 border-blue-300'
                        : 'bg-blue-900/40 text-slate-200 border-blue-800/40 hover:border-blue-300'
                    }`}
                  >
                    📢 Aviso Geral
                  </button>
                </div>
              </div>

              {/* Quick Select Student */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Selecionar Aluno (21 Valentes):
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      setSelectedStudentId(sId);
                      const target = students.find((s) => s.id === sId);
                      if (target) {
                        const email = target.email || `${target.name.toLowerCase().replace(/\s+/g, '.')}@escola.com`;
                        setComposerTo(email);
                        if (selectedTemplate) {
                          applyTemplate(selectedTemplate, sId);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-blue-950/80 border border-blue-800/60 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Escolha um aluno --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Destinatário (Para): *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email.aluno@exemplo.com"
                    value={composerTo}
                    onChange={(e) => setComposerTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-blue-950/80 border border-blue-800/60 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Assunto: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: [Valentes] Relatório de Desempenho e Notas"
                  value={composerSubject}
                  onChange={(e) => setComposerSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-blue-950/80 border border-blue-800/60 text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Conteúdo da Mensagem (HTML ou Texto): *
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Escreva a mensagem pedagógica para o aluno ou responsáveis..."
                  value={composerBody}
                  onChange={(e) => setComposerBody(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-blue-950/80 border border-blue-800/60 text-xs text-white font-mono focus:outline-none focus:border-amber-400 resize-y"
                />
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-950 hover:bg-blue-900/60 border border-blue-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Salvar como Rascunho</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Revisar e Enviar</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR SENDING EMAILS */}
      {confirmationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B192C] border border-amber-500/60 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider font-['Teko',sans-serif]">
                  Confirmar Envio de E-mail
                </h3>
                <p className="text-xs text-slate-300">
                  Operação através da sua conta oficial do Gmail
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-900/60 space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Destinatário: </span>
                <strong className="text-amber-300">{confirmationData.to}</strong>
              </div>
              <div>
                <span className="text-slate-400">Assunto: </span>
                <strong className="text-white">{confirmationData.subject}</strong>
              </div>
              {confirmationData.cc && (
                <div>
                  <span className="text-slate-400">Cc: </span>
                  <span className="text-slate-300">{confirmationData.cc}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-amber-200/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              Tem certeza de que deseja enviar este e-mail? A mensagem será despachada imediatamente em seu nome pelo serviço do Google Gmail.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmationData(null)}
                disabled={isSending}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {isSending ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirmar Envio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR MOVING MESSAGE TO TRASH */}
      {trashConfirmationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B192C] border border-rose-500/50 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider font-['Teko',sans-serif]">
                  Mover para a Lixeira?
                </h3>
                <p className="text-xs text-slate-300">A mensagem será enviada para a lixeira do Gmail.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Esta ação removerá a mensagem da sua visualização principal. Deseja prosseguir?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTrashConfirmationId(null)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmTrash}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                Mover para Lixeira
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
