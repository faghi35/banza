// ============================================================
// Banza AI — Application Express (config + montage des routes)
// NE démarre PAS d'écoute réseau ici : voir server.js (local)
// et le wrapper Vercel (export de cette app).
// ============================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Charge .env depuis api/ (relatif à ce fichier)
dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env"),
});

import healthRoutes from "./routes/health.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { logger } from "./utils/logger.js";

const app = express();

// ------------------------------------------------------------
// CORS — origine explicite (jamais "*" avec credentials)
// ------------------------------------------------------------
const FRONTEND_URLS = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Autorise les requêtes sans origin (curl, same-origin, serveurs)
      if (!origin || FRONTEND_URLS.includes(origin)) {
        return cb(null, true);
      }
      // En développement, on relaxt un peu sans " * " :
      // origine locale => autorisée quand même (proxy absent sur appels directs)
      if (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost:")) {
        return cb(null, true);
      }
      return cb(new Error("Origine non autorisée par CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "X-Requested-With", "X-Guest-Token", "Authorization"],
    maxAge: 86400,
  })
);

// Route OPTIONS préflight (le middleware cors répond déjà, mais on log)
app.options("*", (_req, res) => res.sendStatus(204));

app.use(express.json({ limit: "2mb" }));

// ------------------------------------------------------------
// Journalisation HTTP simple (informations, jamais de secrets)
// ------------------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.http(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ------------------------------------------------------------
// Routes — Phase 2 : /api/health uniquement
// ------------------------------------------------------------
app.use("/api", healthRoutes);

// ------------------------------------------------------------
// Erreur 404 + middleware d'erreur global (TOUJOURS en dernier)
// ------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;