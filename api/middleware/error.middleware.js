// ============================================================
// Banza AI — Middleware global d'erreur Express
// Format : { success:false, error:{ code, message } }
// En production : jamais de stack trace, jamais d'infos sensibles.
// ============================================================

import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

// Route introuvable (404)
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route inconnue : ${req.method} ${req.originalUrl}`,
    },
  });
}

// Middleware central qui capture toutes les erreurs
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    // Erreur applicative : on log la cause technique (sans secret) et on
    // renvoie le message public déjà prévu.
    logger.error(`[${err.code}] ${err.message}`, {
      method: req.method,
      path: req.originalUrl,
      status: err.status,
      cause: err.cause?.code || err.cause?.message || null,
    });
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, ...err.extra },
    });
  }

  // Erreur inattendue : message générique au client, détail complet en log
  const status = typeof err?.status === "number" ? err.status : 500;
  logger.error("erreur non gérée", {
    method: req.method,
    path: req.originalUrl,
    name: err?.name,
    message: err?.message,
    status,
  });

  return res.status(status >= 400 && status < 600 ? status : 500).json({
    success: false,
    error: {
      code: "SERVER_ERROR",
      message: "Impossible de contacter Banza AI. Veuillez réessayer.",
    },
  });
}