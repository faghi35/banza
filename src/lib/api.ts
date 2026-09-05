
// ============================================================
// Banza AI — Service API centralisé
// TOUS les appels HTTP vers le backend PHP passent par ici.
// ============================================================

import type {
  AuthMeResponse,
  ChatImageItem,
  ChatMessage,
  ChatSource,
  Conversation,
  GuestSessionData,
  HealthStatus,
  UsageInfo,
  User,
} from "./types";
import { getGuestToken, saveGuestToken } from "./auth-gate";

// Ré-export pour les composants qui typent leurs handlers de streaming.
export type { ChatImageItem, ChatSource, UsageInfo };

// URL de base de l'API officielle Banza AI.
// En production (Vercel) comme en appel direct : https://banza-ai.onekana-agency.com
// En dev local : peut être surchargé par VITE_API_URL via .env.local
const OFFICIAL_API_URL = "https://banza-ai.onekana-agency.com";

export const API_URL = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).trim()
    : "") || OFFICIAL_API_URL
).replace(/\/+$/, "");

// Délais de sécurité : aucune requête ne doit laisser l'interface bloquée
// sur un écran de chargement (spinner) indéfiniment. Si le backend ne répond
// pas, on lève une erreur réseau claire et l'application bascule en mode
// invité avec un message d'erreur plutôt qu'un chargement éternel.
const DEFAULT_REQUEST_TIMEOUT_MS = 12000;
const STREAM_FIRST_BYTE_TIMEOUT_MS = 15000;

/**
 * Prépare les paramètres de fetch avec un délai maximal.
 * Le signal interne aborde la requête au bout du délai (ou si l'appelant
 * annule via `externalSignal`) ; `exceeded` indique si le timeout interne
 * est la cause de l'annulation.
 */
function timeoutFetchInit(
  timeoutMs: number,
  externalSignal?: AbortSignal | null
): { signal: AbortSignal; exceeded: () => boolean; stop: () => void } {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAborted = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAborted, { once: true });
  }
  return {
    signal: controller.signal,
    exceeded: () => timedOut,
    stop: () => {
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener("abort", onExternalAborted);
    },
  };
}

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: Record<string, unknown> | null;

  constructor(message: string, status: number, code?: string, data?: Record<string, unknown> | null) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// ------------------------------------------------------------
// Helpers internes
// ------------------------------------------------------------

function getRequestHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  const token = getGuestToken();
  if (token) {
    headers["X-Guest-Token"] = token;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res: Response;
  const extraHeaders = (options.headers as Record<string, string>) || {};
  const guarded = timeoutFetchInit(DEFAULT_REQUEST_TIMEOUT_MS, options.signal);
  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: "include", // cookies de session PHP + banza_guest_token
      headers: getRequestHeaders(extraHeaders),
      ...options,
      signal: guarded.signal,
    });
  } catch (err) {
    if (guarded.exceeded()) {
      throw new ApiError(
        "Impossible de contacter Banza AI : le serveur ne répond pas. Vérifiez votre connexion puis réessayez.",
        0,
        "NETWORK_ERROR"
      );
    }
    if (options.signal?.aborted) {
      // Annulation explicite de l'appelant : on re-propage l'erreur d'origine.
      throw err;
    }
    throw new ApiError(
      "Impossible de contacter Banza AI. Veuillez vérifier votre connexion.",
      0
    );
  } finally {
    guarded.stop();
  }

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    throw new ApiError(
      data?.error ?? "Une erreur est survenue. Veuillez réessayer.",
      res.status,
      data?.code,
      data
    );
  }
  return data as T;
}

function jsonBody(body: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(body) };
}

// ------------------------------------------------------------
// Auth
// ------------------------------------------------------------

export const authApi = {
  register: (name: string, email: string, password: string, guestToken?: string) => {
    const token = guestToken ?? getGuestToken() ?? undefined;
    return request<{ user: User }>("/api/auth/register", jsonBody({ name, email, password, guest_token: token }));
  },

  login: (email: string, password: string, guestToken?: string) => {
    const token = guestToken ?? getGuestToken() ?? undefined;
    return request<{ user: User }>("/api/auth/login", jsonBody({ email, password, guest_token: token }));
  },

  logout: () => request<{ message: string }>("/api/auth/logout", { method: "POST" }),

  me: async () => {
    const res = await request<AuthMeResponse>("/api/auth/me");
    if (res.guest?.session_token) {
      saveGuestToken(res.guest.session_token);
    }
    return res;
  },
};

// ------------------------------------------------------------
// Mode Invité (Guest)
// ------------------------------------------------------------

export const guestApi = {
  usage: async () => {
    const token = getGuestToken() ?? "";
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    const res = await request<GuestSessionData>(`/api/guest/usage${query}`);
    if (res.session_token) saveGuestToken(res.session_token);
    return res;
  },

  session: async (guestToken?: string) => {
    const token = guestToken ?? getGuestToken() ?? undefined;
    const res = await request<GuestSessionData>("/api/guest/session", jsonBody({ guest_token: token }));
    if (res.session_token) saveGuestToken(res.session_token);
    return res;
  },

  migrate: (guestToken?: string) => {
    const token = guestToken ?? getGuestToken() ?? undefined;
    return request<{ success: boolean; migrated_conversations: number }>(
      "/api/guest/migrate",
      jsonBody({ guest_token: token })
    );
  },
};

// ------------------------------------------------------------
// Conversations & messages
// ------------------------------------------------------------

export const conversationsApi = {
  list: () => request<{ conversations: Conversation[] }>("/api/conversations"),

  create: (title?: string) =>
    request<{ conversation: Conversation }>("/api/conversations", jsonBody({ title })),

  get: (id: number) =>
    request<{ conversation: Conversation & { messages: ChatMessage[] } }>(
      `/api/conversations/${id}`
    ),

  rename: (id: number, title: string) =>
    request<{ conversation: Conversation }>(`/api/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),

  remove: (id: number) =>
    request<{ message: string }>(`/api/conversations/${id}`, { method: "DELETE" }),
};

// ------------------------------------------------------------
// Chat — streaming SSE réel (fetch + ReadableStream)
// ------------------------------------------------------------

export interface ChatPerfMetadata {
  router_ms: number;
  search_ms: number;
  ttft_ms: number;
  gen_ms: number;
  total_ms: number;
  tokens: number;
}

export interface ChatStreamHandlers {
  onMeta?: (meta: {
    conversation_id: number;
    model: string;
    request_id?: string;
    used_search?: boolean;
    used_image_search?: boolean;
    authenticated?: boolean;
    guest?: boolean;
    usage?: UsageInfo;
  }) => void;
  onDelta: (text: string) => void;
  onError?: (message: string, code?: string, usage?: UsageInfo) => void;
  /** Début d'une recherche web ou d'images (indicateur « Banza cherche… »). */
  onSearching?: (label: string) => void;
  /** Sources citées reçues (avant/avec la réponse). */
  onSources?: (sources: ChatSource[]) => void;
  /** Images Web reçues en streaming. */
  onImages?: (images: ChatImageItem[]) => void;
  onDone?: (payload: {
    conversation_id: number;
    request_id?: string;
    assistant_message?: ChatMessage;
    sources?: ChatSource[];
    images?: ChatImageItem[];
    type?: string;
    perf?: ChatPerfMetadata;
    authenticated?: boolean;
    guest?: boolean;
    usage?: UsageInfo;
  }) => void;
}

export async function streamChat(
  message: string,
  conversationId: number | null,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
  requestId?: string
): Promise<void> {
  let res: Response;
  const guestToken = getGuestToken();
  const guarded = timeoutFetchInit(STREAM_FIRST_BYTE_TIMEOUT_MS, signal);

  try {
    res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      credentials: "include",
      headers: getRequestHeaders(),
      body: JSON.stringify({
        message,
        conversation_id: conversationId ?? undefined,
        request_id: requestId ?? undefined,
        guest_token: guestToken ?? undefined,
      }),
      signal: guarded.signal,
    });
  } catch (e) {
    if (guarded.exceeded()) {
      throw new ApiError(
        "Banza AI ne répond pas. Vérifiez votre connexion puis réessayez.",
        0,
        "NETWORK_ERROR"
      );
    }
    if ((e as Error).name === "AbortError") return;
    throw new ApiError("Impossible de contacter Banza AI. Veuillez vérifier votre connexion.", 0);
  } finally {
    guarded.stop();
  }

  // Erreur métier : réponse JSON classique ou code HTTP d'erreur (401, 403, 429, 500, 502, 503…)
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("text/event-stream")) {
    const data = await res.json().catch(() => null);
    const errorMsg = data?.error ?? data?.message ?? `Erreur serveur (${res.status})`;
    const errorCode = data?.code;
    throw new ApiError(errorMsg, res.status, errorCode, data);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processEvent = (raw: string) => {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return;
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(dataLines.join("\n"));
    } catch {
      return;
    }

    switch (event) {
      case "meta":
        handlers.onMeta?.(payload as never);
        break;
      case "delta":
        handlers.onDelta(String(payload.text ?? ""));
        break;
      case "error":
        handlers.onError?.(
          String(payload.message ?? payload.error ?? "Erreur inconnue."),
          String(payload.code ?? ""),
          payload.usage as UsageInfo | undefined
        );
        break;
      case "searching":
        handlers.onSearching?.(String(payload.label ?? "Banza cherche des informations à jour…"));
        break;
      case "sources":
        handlers.onSources?.(
          Array.isArray(payload.sources) ? (payload.sources as ChatSource[]) : []
        );
        break;
      case "images":
        handlers.onImages?.(
          Array.isArray(payload.images) ? (payload.images as ChatImageItem[]) : []
        );
        break;
      case "done":
        handlers.onDone?.(payload as never);
        break;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      processEvent(rawEvent);
    }
  }
}

// ------------------------------------------------------------
// Santé du backend
// ------------------------------------------------------------

export const healthApi = {
  status: () =>
    request<HealthStatus>("/api/health"),
};

// ------------------------------------------------------------
// Administration — RBAC côté serveur (role = 'admin' requis)
// ------------------------------------------------------------

export interface AdminStats {
  users: number;
  admins: number;
  guests: number;
  guest_sessions_active?: number;
  guest_sessions_converted?: number;
  guest_sessions_expired?: number;
  guest_conversion_rate?: number;
  guest_messages?: number;
  registered_messages?: number;
  avg_messages_before_signup?: number;
  conversations: number;
  messages: number;
  active_today: number;
  messages_today: number;
  ai: "configured" | "not_configured";
  model: string | null;
  models_total?: number;
  models_active?: number;
}

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  is_guest: boolean | number;
  created_at: string;
  last_active_at: string | null;
  conversations_count: number;
  messages_count: number;
}

export interface ActivityLogRow {
  id: number;
  user_id: number | null;
  action: string;
  level: "info" | "warn" | "error";
  message: string;
  ip: string | null;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
}

export const adminApi = {
  stats: () => request<{ stats: AdminStats }>("/api/admin/stats"),

  users: (q = "", page = 1) =>
    request<{ users: AdminUserRow[]; total: number; page: number; per_page: number }>(
      `/api/admin/users?q=${encodeURIComponent(q)}&page=${page}`
    ),

  updateUser: (
    id: number,
    patch: { role?: "user" | "admin"; status?: "active" | "suspended" }
  ) =>
    request<{ user: unknown }>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteUser: (id: number) =>
    request<{ message: string }>(`/api/admin/users/${id}`, { method: "DELETE" }),

  logs: (limit = 100) =>
    request<{ logs: ActivityLogRow[] }>(`/api/admin/logs?limit=${limit}`),
};

// ------------------------------------------------------------
// Administration — Modèles IA (catalogue llm_models)
// ------------------------------------------------------------

export interface LlmModelCapabilities {
  text_generation?: boolean;
  image_understanding?: boolean;
  image_generation?: boolean;
  audio_processing?: boolean;
  video_processing?: boolean;
  document_analysis?: boolean;
  ocr?: boolean;
  coding?: boolean;
  embedding?: boolean;
  search_semantic?: boolean;
}

export interface LlmModelRow {
  id: number;
  name: string;
  provider: string;
  model_name: string;
  api_type?: string | null;
  api_endpoint?: string | null;
  api_key_masked: string | null;
  has_key: boolean;
  status: "active" | "inactive" | "degraded";
  priority: number;
  context_window: number;
  max_tokens: number;
  temperature: number;
  cost_level: string;
  capabilities: LlmModelCapabilities;
  created_at?: string | null;
  updated_at?: string | null;
}

export const llmModelsApi = {
  list: () => request<{ models: LlmModelRow[] }>("/api/admin/models"),

  create: (data: Record<string, string | number>) =>
    request<{ model: LlmModelRow }>("/api/admin/models", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Record<string, string | number>) =>
    request<{ model: LlmModelRow }>(`/api/admin/models/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    request<{ message: string }>(`/api/admin/models/${id}`, { method: "DELETE" }),
};

// ------------------------------------------------------------
// Administration — AI / Orchestration (recherche web, stats)
// ------------------------------------------------------------

export interface OrchestrationStats {
  llm: string;
  web_search: string;
  search_enabled: boolean;
  automatic: boolean;
  citations: boolean;
  validation: boolean;
  max_results: number;
  max_retries: number;
  requests: number;
  search_count: number;
  search_avg_ms: number | null;
  search_min_ms: number | null;
  search_max_ms: number | null;
  search_errors: number;
  llm_calls: number;
  llm_avg_ms: number | null;
  llm_errors: number;
  /** Time To First Token — métriques de performance streaming */
  ttft_avg_ms: number | null;
  ttft_min_ms: number | null;
  ttft_max_ms: number | null;
  tokens_total: number;
  tokens_per_sec: number | null;
  slow_requests: number;
  error_rate_pct: number;
  validations: number;
  regenerations: number;
  fallbacks: number;
  citations_sent: number;
}

export interface OrchestrationSettings {
  search_enabled: boolean;
  automatic: boolean;
  citations: boolean;
  validation: boolean;
  max_results: number;
  max_retries: number;
  provider: string;
}

export const orchestrationApi = {
  get: () =>
    request<{ stats: OrchestrationStats; settings: OrchestrationSettings }>(
      "/api/admin/orchestration"
    ),

  updateSettings: (patch: Partial<OrchestrationSettings>) =>
    request<{ settings: OrchestrationSettings }>(
      "/api/admin/orchestration/settings",
      { method: "PUT", body: JSON.stringify(patch) }
    ),
};

// ============================================================
// Mode conversation vocale
// STT/TTS s'exécutent côté client (Web Speech API). Ces endpoints
// gèrent la session, les quotas serveur, les stats et l'admin.
// ============================================================

import type {
  VoiceCompletePayload,
  VoiceConfig,
  VoiceLogRow,
  VoiceSessionStart,
  VoiceUsage,
} from "./types";

export interface VoiceAdminStats {
  config: VoiceConfig;
  sessions_total: number;
  sessions_today: number;
  sessions_completed: number;
  sessions_interrupted: number;
  sessions_errors: number;
  guest_sessions: number;
  minutes_total: number;
  minutes_today: number;
  stt_avg_ms: number | null;
  llm_avg_ttft_ms: number | null;
  tts_avg_ms: number | null;
  total_avg_ms: number | null;
  errors: number;
  llm_model: string;
}

export const voiceApi = {
  /** Démarre une session vocale (vérifie le quota côté serveur). */
  start: (language?: string) =>
    request<VoiceSessionStart>("/api/voice/session", jsonBody({ language })),

  /** Journalise la fin d'une session (latences réelles mesurées côté client). */
  complete: (payload: VoiceCompletePayload) =>
    request<{ success?: boolean; voice_usage: VoiceUsage }>(
      "/api/voice/complete",
      jsonBody(payload)
    ),

  /** Signale une interruption (barge-in). */
  interrupt: (voiceSessionId: string) =>
    request<{ success?: boolean }>("/api/voice/interrupt", jsonBody({ voice_session_id: voiceSessionId })),

  // --- Admin ---
  adminStats: () => request<VoiceAdminStats>("/api/admin/voice"),

  adminLogs: (limit = 50) =>
    request<{ logs: VoiceLogRow[] }>(`/api/admin/voice/logs?limit=${limit}`),

  adminSaveSettings: (patch: Partial<VoiceConfig>) =>
    request<{ config: VoiceConfig }>("/api/admin/voice/settings", {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
};
