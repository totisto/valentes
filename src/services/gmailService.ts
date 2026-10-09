import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly'
];

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  isUnread: boolean;
  labelIds: string[];
}

export interface GmailMessageDetail extends GmailMessageSummary {
  bodyHtml?: string;
  bodyText?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

// In-memory token storage (MANDATORY: DO NOT STORE IN LOCALSTORAGE OR SESSIONSTORAGE)
let inMemoryAccessToken: string | null = null;
let inMemoryProfile: GmailProfile | null = null;

export const setCachedGmailToken = (token: string | null) => {
  inMemoryAccessToken = token;
  if (!token) {
    inMemoryProfile = null;
  }
};

export const getCachedGmailToken = (): string | null => {
  return inMemoryAccessToken;
};

export const isGmailConnected = (): boolean => {
  return !!inMemoryAccessToken;
};

/**
 * Connect to Gmail via Firebase GoogleAuthProvider with the requested scopes.
 * Caches the OAuth access token in-memory only.
 */
export const connectGmail = async (): Promise<{ token: string; email: string }> => {
  try {
    const provider = new GoogleAuthProvider();
    GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
    provider.setCustomParameters({
      prompt: 'consent'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Gmail. Permissão não concedida.');
    }

    inMemoryAccessToken = credential.accessToken;
    return { token: credential.accessToken, email: result.user.email || '' };
  } catch (err: any) {
    console.error('Erro ao conectar ao Gmail:', err);
    throw err;
  }
};

export const disconnectGmail = () => {
  inMemoryAccessToken = null;
  inMemoryProfile = null;
};

/**
 * Helper to encode text into RFC 2822 base64url safe string
 */
function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Helper to decode base64url safe string
 */
function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return atob(base64);
  }
}

/**
 * Fetches the user's Gmail profile
 */
export const fetchGmailProfile = async (): Promise<GmailProfile> => {
  if (!inMemoryAccessToken) {
    throw new Error('Gmail não conectado. Conecte sua conta do Google primeiro.');
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${inMemoryAccessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      inMemoryAccessToken = null;
      throw new Error('Sessão do Gmail expirada. Por favor, conecte novamente.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Erro ao carregar perfil do Gmail (${res.status})`);
  }

  const data = await res.json();
  inMemoryProfile = data;
  return data;
};

/**
 * Lists messages from user's mailbox with summary metadata
 */
export const listGmailMessages = async (params?: {
  maxResults?: number;
  q?: string;
  labelIds?: string[];
  pageToken?: string;
}): Promise<{ messages: GmailMessageSummary[]; nextPageToken?: string }> => {
  if (!inMemoryAccessToken) {
    throw new Error('Gmail não conectado.');
  }

  const queryParams = new URLSearchParams();
  queryParams.set('maxResults', String(params?.maxResults || 15));
  if (params?.q) queryParams.set('q', params.q);
  if (params?.pageToken) queryParams.set('pageToken', params.pageToken);
  if (params?.labelIds && params.labelIds.length > 0) {
    params.labelIds.forEach((l) => queryParams.append('labelIds', l));
  }

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${inMemoryAccessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      inMemoryAccessToken = null;
      throw new Error('Sessão do Gmail expirada. Conecte novamente.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Falha ao buscar mensagens do Gmail');
  }

  const data = await res.json();
  const rawList: { id: string; threadId: string }[] = data.messages || [];

  if (rawList.length === 0) {
    return { messages: [], nextPageToken: data.nextPageToken };
  }

  // Fetch metadata details for each message (parallel with max 15)
  const summaries = await Promise.all(
    rawList.slice(0, 15).map(async (msg) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${inMemoryAccessToken}`,
              Accept: 'application/json'
            }
          }
        );
        if (!itemRes.ok) return null;
        const itemData = await itemRes.json();
        const headers: { name: string; value: string }[] = itemData.payload?.headers || [];

        const getHeader = (name: string) =>
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const isUnread = (itemData.labelIds || []).includes('UNREAD');

        return {
          id: itemData.id,
          threadId: itemData.threadId,
          snippet: itemData.snippet || '',
          subject: getHeader('Subject') || '(Sem assunto)',
          from: getHeader('From') || '(Remetente desconhecido)',
          to: getHeader('To') || '',
          date: getHeader('Date') || '',
          isUnread,
          labelIds: itemData.labelIds || []
        } as GmailMessageSummary;
      } catch {
        return null;
      }
    })
  );

  return {
    messages: summaries.filter((m): m is GmailMessageSummary => m !== null),
    nextPageToken: data.nextPageToken
  };
};

/**
 * Fetch full message details including HTML and text body
 */
export const getGmailMessageDetail = async (messageId: string): Promise<GmailMessageDetail> => {
  if (!inMemoryAccessToken) {
    throw new Error('Gmail não conectado.');
  }

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: {
      Authorization: `Bearer ${inMemoryAccessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Falha ao obter mensagem ${messageId}`);
  }

  const data = await res.json();
  const headers: { name: string; value: string }[] = data.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  let bodyHtml = '';
  let bodyText = '';

  const parseParts = (parts: any[]) => {
    if (!parts) return;
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText += decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml += decodeBase64Url(part.body.data);
      }
      if (part.parts) {
        parseParts(part.parts);
      }
    }
  };

  if (data.payload?.body?.data) {
    if (data.payload.mimeType === 'text/html') {
      bodyHtml = decodeBase64Url(data.payload.body.data);
    } else {
      bodyText = decodeBase64Url(data.payload.body.data);
    }
  } else if (data.payload?.parts) {
    parseParts(data.payload.parts);
  }

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet || '',
    subject: getHeader('Subject') || '(Sem assunto)',
    from: getHeader('From') || '',
    to: getHeader('To') || '',
    date: getHeader('Date') || '',
    isUnread: (data.labelIds || []).includes('UNREAD'),
    labelIds: data.labelIds || [],
    bodyHtml: bodyHtml || undefined,
    bodyText: bodyText || undefined
  };
};

/**
 * Send an email via Gmail API.
 * NOTE: UI MUST present an explicit confirmation dialog before invoking this function!
 */
export const sendGmailEmail = async (options: SendEmailOptions): Promise<{ id: string }> => {
  if (!inMemoryAccessToken) {
    throw new Error('Gmail não conectado.');
  }

  const { to, subject, body, cc, bcc } = options;

  let emailContent = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    bcc ? `Bcc: ${bcc}` : null,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    body
  ]
    .filter(Boolean)
    .join('\r\n');

  const raw = encodeBase64Url(emailContent);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${inMemoryAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Falha ao enviar e-mail via Gmail.');
  }

  return await res.json();
};

/**
 * Save draft email in Gmail
 */
export const saveGmailDraft = async (options: SendEmailOptions): Promise<{ id: string }> => {
  if (!inMemoryAccessToken) {
    throw new Error('Gmail não conectado.');
  }

  const { to, subject, body } = options;

  let emailContent = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    body
  ].join('\r\n');

  const raw = encodeBase64Url(emailContent);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${inMemoryAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: { raw } })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Falha ao salvar rascunho no Gmail.');
  }

  return await res.json();
};

/**
 * Trash an email (move to trash)
 * UI MUST require user confirmation dialog before calling!
 */
export const trashGmailMessage = async (messageId: string): Promise<void> => {
  if (!inMemoryAccessToken) {
    throw new Error('Gmail não conectado.');
  }

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${inMemoryAccessToken}`
    }
  });

  if (!res.ok) {
    throw new Error('Falha ao mover mensagem para a lixeira.');
  }
};
