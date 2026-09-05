// ============================================================
// Banza AI — Vercel : point d'entrée serverless
// Exporte l'application Express telle quelle (gérée par Vercel).
// NE JAMAIS appeler app.listen() ici.
// ============================================================

import app from "./app.js";

export default app;