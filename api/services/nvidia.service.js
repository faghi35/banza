// ============================================================
// Banza AI — Service NVIDIA (config / état)
// La clé API ne sort JAMAIS de ce module (ni vers le client ni
// dans les logs). Phase 2 : vérification de configuration uniquement.
// ============================================================

import { logger } from "../utils/logger.js";

function safeEnv(name, fallback = "") {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : fallback;
}

/**
 * Retourne les informations NVIDIA "publiques" pour /health :
 *  - configured : booléen (clé présente)
 *  - model      : nom du modèle (jamais la clé)
 */
export function getNvidiaStatus() {
  const apiKey = safeEnv("NVIDIA_API_KEY");
  const baseUrl = safeEnv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1");
  const model = safeEnv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct");

  const configured = apiKey !== "" && baseUrl !== "";

  if (!configured) {
    logger.nvidia("non configuré (clé manquante)");
  }

  return {
    configured,
    model: configured ? model : null,
  };
}