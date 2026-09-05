// ============================================================
// Banza AI — Erreurs applicatives centralisées
// Format standard :
//   { success: false, error: { code, message } }
// ============================================================

export class AppError extends Error {
  constructor(message, code = "SERVER_ERROR", status = 500, extra = {}, cause) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.extra = extra;
    this.cause = cause;
  }
}

export function badRequest(message, code = "BAD_REQUEST", extra = {}) {
  return new AppError(message, code, 400, extra);
}

export function unprocessable(message, code = "UNPROCESSABLE_ENTITY", extra = {}) {
  return new AppError(message, code, 422, extra);
}

export function unauthorized(message = "Non authentifié. Veuillez vous connecter.", code = "AUTH_REQUIRED") {
  return new AppError(message, code, 401);
}

export function forbidden(message, code = "FORBIDDEN", extra = {}) {
  return new AppError(message, code, 403, extra);
}

export function notFound(message = "Ressource introuvable.", code = "NOT_FOUND") {
  return new AppError(message, code, 404);
}

export function rateLimited(message, code = "RATE_LIMIT", extra = {}) {
  return new AppError(message, code, 429, extra);
}

export function quotaExceeded(message, code = "DAILY_QUOTA_EXCEEDED", extra = {}) {
  return new AppError(message, code, 403, extra);
}

/**
 * Erreur MySQL / base de données indisponible.
 * Ne transporte AUCUN détail sensible vers le client.
 */
export function databaseUnavailable(cause) {
  return new AppError(
    "Le service Banza AI est momentanément indisponible.",
    "DATABASE_UNAVAILABLE",
    503,
    {},
    cause
  );
}

export function serviceUnavailable(message, code = "SERVICE_UNAVAILABLE", extra = {}) {
  return new AppError(message, code, 503, extra);
}

export function aiProviderError(message = "Le service IA est momentanément indisponible.", code = "AI_PROVIDER_ERROR", extra = {}) {
  return new AppError(message, code, 502, extra);
}