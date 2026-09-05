// ============================================================
// Banza AI — Démarrage LOCAL uniquement
// En production (Vercel), ne PAS utiliser ce fichier : l'app
// Express est exportée et exécutée comme Vercel Function.
// ============================================================

import app from "./app.js";
import { closePool } from "./db/mysql.js";
import { logger } from "./utils/logger.js";
import { VERSION } from "./controllers/health.controller.js";

const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, () => {
  logger.object("HTTP", {
    message: "serveur démarré",
    port: PORT,
    env: process.env.NODE_ENV || "development",
    version: VERSION,
    health: `http://localhost:${PORT}/api/health`,
  });
});

// Arrêt propre (Ctrl+C / signal)
function shutdown(signal) {
  logger.http(`réception ${signal}, arrêt du serveur…`);
  server.close(async () => {
    try {
      await closePool();
    } finally {
      process.exit(0);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));