// Banza AI — Types partagés

export interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  reset_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  /** Rôle renvoyé par le backend (user | admin) */
  role?: string | null;
  status?: string | null;
  is_admin?: boolean | null;
  is_guest?: boolean | null;
  last_active?: string | null;
  usage?: UsageInfo;
  migrated?: {
    success: boolean;
    migrated_conversations: number;
  };
}

export interface GuestSessionData {
  authenticated: boolean;
  guest: boolean;
  role?: string;
  usage: UsageInfo;
  session_token: string;
}

export interface AuthMeResponse {
  authenticated: boolean;
  user: User | null;
  guest: GuestSessionData | null;
}

export interface Conversation {
  id: number;
  user_id?: number | null;
  guest_session_id?: number | null;
  title: string;
  model: string | null;
  created_at: string;
  updated_at: string;
  preview?: string | null;
}

export type MessageRole = "user" | "assistant" | "system" | "tool";

/** Source web citée par une réponse (recherche d'informations récentes). */
export interface ChatSource {
  title: string;
  url: string;
  domain?: string | null;
}

export interface ChatMessage {
  id?: number;
  conversation_id?: number;
  role: MessageRole;
  content: string;
  model?: string | null;
  created_at?: string;
  /** Sources citées (recherche web) — vide si réponse sans recherche. */
  sources?: ChatSource[] | null;
}

export interface HealthStatus {
  success: boolean;
  backend: string;
  database: string;
  ai: "configured" | "not_configured";
  model: string | null;
  version?: string;
}

// ------------------------------------------------------------------
// Types transverses : interfaces partagées de l'interface (UI)
// ------------------------------------------------------------------

/** Élément de conversation unifié côté UI (backend ou invité) */
export interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  model?: string | null;
  isLocal?: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string | null;
  status?: string;
  is_guest?: boolean | number;
  created_at: string;
  last_active?: string | null;
}

export type AuthFeature =
  | "history"
  | "save_conversation"
  | "favorites"
  | "sync"
  | "advanced_files"
  | "personalization"
  | "export";

// ------------------------------------------------------------------
// Mode conversation vocale
// ------------------------------------------------------------------

/** Configuration vocale servie par le backend (providers réels + quotas). */
export interface VoiceConfig {
  enabled: boolean;
  stt_provider: string;
  stt_model: string;
  tts_provider: string;
  tts_model: string;
  /** 'auto' suit la langue détectée, sinon 'fr-FR' / 'en-US'. */
  default_voice: string;
  speed: number;
  languages: string;
  silence_timeout_ms: number;
  push_to_talk: boolean;
  guest_voice_limit: number;
  free_voice_limit: number;
}

/** Quota vocal de l'entité courante (invité ou compte). */
export interface VoiceUsage {
  requests: number;
  limit: number;
  remaining: number;
  minutes: number;
}

/** Réponse de démarrage d'une session vocale. */
export interface VoiceSessionStart {
  success?: boolean;
  voice_session_id: string;
  request_id: string;
  config: VoiceConfig;
  voice_usage: VoiceUsage;
}

export interface VoiceCompletePayload {
  voice_session_id: string;
  language?: string;
  duration_ms?: number;
  transcript_length?: number;
  stt_used_ms?: number;
  llm_ttft_ms?: number;
  tts_used_ms?: number;
  status?: "completed" | "error";
  error_code?: string;
}

export interface VoiceLogRow {
  id: number;
  voice_session_id: string;
  user_id: number | null;
  guest_session_id: number | null;
  language: string | null;
  duration_ms: number;
  transcript_length: number;
  stt_provider: string | null;
  tts_provider: string | null;
  llm_model: string | null;
  status: "active" | "completed" | "interrupted" | "error";
  error_code: string | null;
  created_at: string;
  user_name: string | null;
}
