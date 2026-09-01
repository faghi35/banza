// ============================================================
// Banza AI — Normalisation centralisée des erreurs
// Toute erreur technique est transformée en code applicatif
// contrôlé avant d'atteindre l'interface utilisateur.
// ============================================================

import type { ApiError } from "./api";

// ------------------------------------------------------------
// Codes d'erreurs applicatifs internes
// ------------------------------------------------------------
export type AppErrorCode =
  | "NETWORK_ERROR"       // Pas de connexion ou fetch échoué
  | "AI_TIMEOUT"          // Délai dépassé (504, timeout)
  | "RATE_LIMIT"          // Trop de requêtes (429)
  | "AI_PROVIDER_ERROR"   // Problème côté LLM provider (502)
  | "AI_SERVICE_UNAVAILABLE" // Service indisponible (503)
  | "SEARCH_PROVIDER_UNAVAILABLE" // Moteur de recherche web indisponible
  | "IMAGE_SEARCH_UNAVAILABLE"    // Recherche d'images web indisponible
  | "FEATURE_PLAN_REQUIRED"       // Fonctionnalité nécessitant un plan supérieur
  | "SERVER_ERROR"        // Erreur interne serveur (500)
  | "AUTH_REQUIRED"       // Session expirée / non authentifié (401)
  | "FORBIDDEN"           // Accès refusé (403)
  | "NOT_FOUND"           // Ressource introuvable (404)
  | "GUEST_LIMIT_REACHED" // Quota invité atteint (code métier)
  | "INVALID_RESPONSE"    // Réponse non-JSON ou malformée
  | "UNKNOWN_ERROR";      // Erreur non classifiée

// ------------------------------------------------------------
// Messages UX professionnels pour chaque code
// Ces messages sont les SEULS affichés à l'utilisateur.
// ------------------------------------------------------------
export const USER_MESSAGES: Record<AppErrorCode, string> = {
  NETWORK_ERROR:
    "Impossible de joindre Banza AI pour le moment. Vérifiez votre connexion puis réessayez.",
  AI_TIMEOUT:
    "La réponse de Banza AI prend plus de temps que prévu. Veuillez réessayer.",
  RATE_LIMIT:
    "Banza AI reçoit actuellement beaucoup de demandes. Veuillez patienter quelques instants.",
  AI_PROVIDER_ERROR:
    "Banza AI rencontre temporairement un problème de traitement. Veuillez réessayer.",
  AI_SERVICE_UNAVAILABLE:
    "Banza AI est temporairement indisponible. Veuillez réessayer dans quelques instants.",
  SEARCH_PROVIDER_UNAVAILABLE:
    "Le moteur de recherche Web est temporairement indisponible. Veuillez réessayer dans un instant.",
  IMAGE_SEARCH_UNAVAILABLE:
    "Le service de recherche d'images est momentanément indisponible. Veuillez réessayer plus tard.",
  FEATURE_PLAN_REQUIRED:
    "Cette fonctionnalité nécessite un abonnement Banza Pro.",
  SERVER_ERROR:
    "Une erreur temporaire est survenue. Veuillez réessayer.",
  AUTH_REQUIRED:
    "Votre session a expiré. Veuillez vous reconnecter.",
  FORBIDDEN:
    "Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
  NOT_FOUND:
    "Cette ressource n'existe plus ou n'est pas accessible.",
  GUEST_LIMIT_REACHED:
    "Vous avez atteint la limite d'utilisation en mode invité. Créez un compte pour continuer.",
  INVALID_RESPONSE:
    "Banza AI a renvoyé une réponse inattendue. Veuillez réessayer.",
  UNKNOWN_ERROR:
    "Impossible de traiter votre demande pour le moment. Veuillez réessayer.",
};

// Erreurs récupérables (afficher le bouton « Réessayer »)
export const RETRYABLE_CODES: ReadonlySet<AppErrorCode> = new Set([
  "NETWORK_ERROR",
  "AI_TIMEOUT",
  "RATE_LIMIT",
  "AI_PROVIDER_ERROR",
  "AI_SERVICE_UNAVAILABLE",
  "SERVER_ERROR",
  "INVALID_RESPONSE",
  "UNKNOWN_ERROR",
]);

// ------------------------------------------------------------
// Type de résultat normalisé
// ------------------------------------------------------------
export interface NormalizedError {
  code: AppErrorCode;
  /** Message UX prêt à l'affichage — jamais technique */
  userMessage: string;
  /** Si true, proposer un bouton « Réessayer » */
  retryable: boolean;
  /** Message technique disponible uniquement en dev */
  _devMessage?: string;
}

// ------------------------------------------------------------
// Normalisation à partir d'une ApiError (fetch interne)
// ------------------------------------------------------------
export function normalizeApiError(error: unknown): NormalizedError {
  // Code métier déjà normalisé par le backend
  const apiErr = error as ApiError | null;
  const backendCode = apiErr?.code as string | undefined;
  const httpStatus = apiErr?.status ?? 0;

  // Cas abortError — on ne normalise pas, les aborts sont gérés en amont
  if ((error as Error)?.name === "AbortError") {
    return {
      code: "UNKNOWN_ERROR",
      userMessage: USER_MESSAGES.UNKNOWN_ERROR,
      retryable: false,
    };
  }

  // Code métier explicite du backend
  if (backendCode === "GUEST_LIMIT_REACHED") {
    return {
      code: "GUEST_LIMIT_REACHED",
      userMessage: USER_MESSAGES.GUEST_LIMIT_REACHED,
      retryable: false,
      _devMessage: `[API] code=${backendCode} status=${httpStatus}`,
    };
  }

  // Erreur réseau (status === 0 = fetch failed, pas de connexion)
  if (httpStatus === 0) {
    return {
      code: "NETWORK_ERROR",
      userMessage: USER_MESSAGES.NETWORK_ERROR,
      retryable: true,
      _devMessage: `[API] Network error: ${(error as Error)?.message ?? "unknown"}`,
    };
  }

  // Mapping HTTP status → code applicatif
  let code = HTTP_STATUS_TO_CODE[httpStatus];

  // Si le code HTTP n'a pas permis d'identifier l'erreur ou status 500 générique, analyser le message texte
  if (!code || code === "SERVER_ERROR") {
    const rawText = (apiErr?.message ?? "").toLowerCase();
    if (rawText.includes("indisponible") || rawText.includes("unavailable")) {
      code = "AI_SERVICE_UNAVAILABLE";
    } else if (rawText.includes("fournisseur") || rawText.includes("provider") || rawText.includes("nvidia") || rawText.includes("openai") || rawText.includes("bad gateway")) {
      code = "AI_PROVIDER_ERROR";
    } else if (rawText.includes("timeout") || rawText.includes("délai") || rawText.includes("trop de temps")) {
      code = "AI_TIMEOUT";
    } else if (rawText.includes("rate limit") || rawText.includes("trop de requêtes") || rawText.includes("429")) {
      code = "RATE_LIMIT";
    } else if (!code) {
      code = "UNKNOWN_ERROR";
    }
  }

  return {
    code,
    userMessage: USER_MESSAGES[code],
    retryable: RETRYABLE_CODES.has(code),
    _devMessage: `[API] HTTP ${httpStatus} ${backendCode ? `code=${backendCode}` : ""} msg=${apiErr?.message ?? ""}`,
  };
}

// Mapping HTTP status → code applicatif
const HTTP_STATUS_TO_CODE: Partial<Record<number, AppErrorCode>> = {
  401: "AUTH_REQUIRED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  429: "RATE_LIMIT",
  500: "SERVER_ERROR",
  502: "AI_PROVIDER_ERROR",
  503: "AI_SERVICE_UNAVAILABLE",
  504: "AI_TIMEOUT",
};

// ------------------------------------------------------------
// Normalisation à partir d'une erreur SSE brute (streamChat)
// Le backend peut envoyer un event "error" avec un payload code.
// ------------------------------------------------------------
export function normalizeStreamError(
  rawMessage: string,
  code?: string
): NormalizedError {
  if (code === "GUEST_LIMIT_REACHED") {
    return {
      code: "GUEST_LIMIT_REACHED",
      userMessage: USER_MESSAGES.GUEST_LIMIT_REACHED,
      retryable: false,
      _devMessage: `[SSE] error code=${code}`,
    };
  }

  const rawLower = (rawMessage || "").toLowerCase();

  if (code === "RATE_LIMIT" || rawLower.includes("429") || rawLower.includes("trop de requêtes") || rawLower.includes("rate limit")) {
    return {
      code: "RATE_LIMIT",
      userMessage: USER_MESSAGES.RATE_LIMIT,
      retryable: true,
      _devMessage: `[SSE] error code=${code ?? "RATE_LIMIT"} msg=${rawMessage}`,
    };
  }

  if (code === "AI_TIMEOUT" || rawLower.includes("timeout") || rawLower.includes("délai") || rawLower.includes("temps")) {
    return {
      code: "AI_TIMEOUT",
      userMessage: USER_MESSAGES.AI_TIMEOUT,
      retryable: true,
      _devMessage: `[SSE] timeout msg=${rawMessage}`,
    };
  }

  if (
    code === "AI_PROVIDER_ERROR" ||
    rawLower.includes("fournisseur") ||
    rawLower.includes("provider") ||
    rawLower.includes("nvidia") ||
    rawLower.includes("openai") ||
    rawLower.includes("bad gateway") ||
    rawLower.includes("modèle") ||
    rawLower.includes("refusé") ||
    rawLower.includes("model")
  ) {
    return {
      code: "AI_PROVIDER_ERROR",
      userMessage: USER_MESSAGES.AI_PROVIDER_ERROR,
      retryable: true,
      _devMessage: `[SSE] error code=${code ?? "AI_PROVIDER_ERROR"} msg=${rawMessage}`,
    };
  }

  if (code === "AI_SERVICE_UNAVAILABLE" || rawLower.includes("indisponible") || rawLower.includes("unavailable") || rawLower.includes("momentanément")) {
    return {
      code: "AI_SERVICE_UNAVAILABLE",
      userMessage: USER_MESSAGES.AI_SERVICE_UNAVAILABLE,
      retryable: true,
      _devMessage: `[SSE] error code=${code ?? "AI_SERVICE_UNAVAILABLE"} msg=${rawMessage}`,
    };
  }

  if (code === "SERVER_ERROR" || rawLower.includes("500") || rawLower.includes("internal server error")) {
    return {
      code: "SERVER_ERROR",
      userMessage: USER_MESSAGES.SERVER_ERROR,
      retryable: true,
      _devMessage: `[SSE] error code=${code ?? "SERVER_ERROR"} msg=${rawMessage}`,
    };
  }

  // Erreur générique non classifiée
  return {
    code: "UNKNOWN_ERROR",
    userMessage: USER_MESSAGES.UNKNOWN_ERROR,
    retryable: true,
    _devMessage: `[SSE] unclassified error code=${code ?? "?"} msg=${rawMessage}`,
  };
}

// ------------------------------------------------------------
// Logger développeur — ne logue jamais de secrets
// ------------------------------------------------------------
export function devLog(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    // Filtrage des champs sensibles avant log
    const safeError = sanitizeForLog(error);
    console.error(`[Banza AI] ${context}`, safeError);
  }
}

function sanitizeForLog(error: unknown): unknown {
  if (error === null || typeof error !== "object") return error;
  const SENSITIVE_KEYS = new Set([
    "authorization", "x-api-key", "x-guest-token", "cookie",
    "password", "token", "secret", "key", "credential",
  ]);
  const obj = error as Record<string, unknown>;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      safe[k] = "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      safe[k] = sanitizeForLog(v);
    } else {
      safe[k] = v;
    }
  }
  return safe;
}
