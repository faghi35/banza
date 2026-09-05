// ============================================================
// Banza AI — Contrôleur Health Check
// GET /api/health
// ============================================================

import { ping } from "../db/mysql.js";
import { databaseUnavailable } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { getNvidiaStatus } from "../services/nvidia.service.js";

export const VERSION = "2.0.0";

export async function health(_req, res) {
  try {
    await ping();
  } catch (err) {
    logger.database("health check: base inaccessible", {
      code: err.code,
      message: err.message,
    });
    throw databaseUnavailable(err);
  }

  const ai = getNvidiaStatus();

  res.status(200).json({
    success: true,
    backend: "ok",
    database: "ok",
    ai: ai.configured ? "configured" : "not_configured",
    model: ai.model,
    version: VERSION,
  });
}