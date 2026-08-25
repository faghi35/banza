// ============================================================
// Banza AI — Assainissement des réponses générées
// Le logo et le domaine Banza sont gérés UNIQUEMENT par l'interface.
// Cette fonction nettoie toute fuite Markdown / URL vers le logo
// que le modèle pourrait générer (défense en profondeur, en plus de
// la sanitisation serveur dans BanzaOrchestrator::sanitizeAnswer).
// ============================================================

const LOGO_PATTERNS: RegExp[] = [
  // Image Markdown ![Banza AI](https://...logo-...png)
  /!\[[^\]]*\]\([^)]*(?:logo[-_]?banza|banza[-_]?ai)[^)]*\)/gi,
  // Lien Markdown [Banza AI](https://...logo-...png) ou vers le domaine Banza
  /\[[^\]]*\]\([^)]*(?:logo[-_]?banza|banza[-_]?ai|banza[-_]?zeta\.vercel\.app)[^)]*\)/gi,
  // URL nue vers le logo / site Banza (avec ou sans extension image)
  /https?:\/\/[^\s)\]>]*(?:banza[-_]?(?:ai|zeta)|logo[-_]?banza)[^\s)\]>]*/gi,
  // Image Markdown rad ou HTML <img>
  /<img[^>]*(?:logo[-_]?banza|banza[-_]?ai)[^>]*>/gi,
];

const DOMAINS_TO_STRIP = ["banza-zeta.vercel.app", "banza-ai.onekana-agency.com"];

/** Supprime toute référence au logo / site Banza dans le contenu généré. */
export function sanitizeAssistantAnswer(text: string): string {
  if (!text) return text;
  let out = text;
  for (const re of LOGO_PATTERNS) {
    out = out.replace(re, "");
  }
  for (const domain of DOMAINS_TO_STRIP) {
    out = out.split(domain).join("");
  }
  // Nettoie les blancs résiduels laissés par les suppressions
  out = out.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
  return out;
}