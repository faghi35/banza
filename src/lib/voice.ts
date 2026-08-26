// ============================================================
// Banza AI — Moteur de conversation vocale
// ------------------------------------------------------------
// Providers réellement disponibles sans API supplémentaire :
//   - STT : Web Speech API (`SpeechRecognition`) — Chrome/Edge
//     (moteur Google) et Safari iOS (webkit). fr-FR / en-US.
//   - TTS : Web Speech API (`speechSynthesis`) — voix système,
//     supporte lang / rate / pitch / interruption immédiate.
// Aucun endpoint STT/TTS hébergé n'existe encore dans l'infra ;
// les interfaces ci-dessous sont le point d'extension pour un
// futur provider serveur (Whisper / Riva) SANS en inventer.
// ============================================================

import type { VoiceConfig } from "./types";

// ------------------------------------------------------------------
// Types navigateur (absents du lib DOM par défaut)
// ------------------------------------------------------------------

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | SpeechRecognitionCtor
    | undefined;
  return ctor ?? null;
}

export function isSttSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// ------------------------------------------------------------------
// Erreurs normalisées (messages humains, jamais de stack trace)
// ------------------------------------------------------------------

export type VoiceErrorCode =
  | "MICROPHONE_DENIED"
  | "STT_UNAVAILABLE"
  | "STT_TIMEOUT"
  | "LLM_ERROR"
  | "TTS_UNAVAILABLE"
  | "QUOTA_EXCEEDED"
  | "NETWORK_ERROR";

const ERROR_MESSAGES: Record<VoiceErrorCode, string> = {
  MICROPHONE_DENIED:
    "Impossible d'utiliser le mode vocal : l'accès au microphone a été refusé. Autorisez-le dans votre navigateur puis réessayez.",
  STT_UNAVAILABLE:
    "La reconnaissance vocale n'est pas disponible sur ce navigateur. Utilisez Chrome, Edge ou Safari récent.",
  STT_TIMEOUT:
    "Je n'ai rien entendu. Réessayez en parlant un peu plus près du micro.",
  LLM_ERROR: "Banza n'a pas réussi à générer une réponse. Veuillez réessayer.",
  TTS_UNAVAILABLE: "La synthèse vocale n'est pas disponible sur cet appareil.",
  QUOTA_EXCEEDED:
    "Votre quota vocal quotidien est atteint. Réessayez demain.",
  NETWORK_ERROR:
    "Connexion interrompue. Vérifiez votre réseau puis réessayez.",
};

export function voiceErrorMessage(code: VoiceErrorCode): string {
  return ERROR_MESSAGES[code];
}