// ============================================================
// Banza AI — Logique d'autorisation et passerelle Guest -> Compte
// ============================================================

import type { AuthFeature } from "./types";

const PENDING_MSG_KEY = "banza_pending_message";
const GUEST_TOKEN_KEY = "banza_guest_token";

export interface FeatureRequirement {
  required: boolean;
  title: string;
  description: string;
  benefits: string[];
}

export function requiresAuthentication(feature: AuthFeature): FeatureRequirement {
  switch (feature) {
    case "history":
      return {
        required: true,
        title: "Historique permanent",
        description: "Vos conversations invitées sont temporaires. Créez un compte gratuit pour conserver tout votre historique et le retrouver plus tard.",
        benefits: [
          "Historique complet illimité dans le temps",
          "Recherche textuelle dans toutes vos conversations",
          "Accès depuis tous vos navigateurs et appareils",
        ],
      };
    case "save_conversation":
      return {
        required: true,
        title: "Sauvegarder la conversation",
        description: "Créez un compte gratuit pour sauvegarder cette conversation dans le cloud et y accéder en toute sécurité.",
        benefits: [
          "Sauvegarde sécurisée dans le cloud Banza",
          "Reprise instantanée sur mobile et desktop",
          "Exportation et partage sécurisé",
        ],
      };
    case "favorites":
      return {
        required: true,
        title: "Favoris & Épingles",
        description: "Épinglez vos échanges importants en créant votre compte gratuit.",
        benefits: [
          "Accès rapide aux réponses clés",
          "Organisation par dossiers et thématiques",
        ],
      };
    case "sync":
      return {
        required: true,
        title: "Synchronisation multi-appareils",
        description: "Synchronisez vos conversations sur votre ordinateur, tablette et smartphone.",
        benefits: [
          "Continuité parfaite entre vos écrans",
          "Chiffrement et isolation des sessions",
        ],
      };
    case "advanced_files":
      return {
        required: true,
        title: "Pièces jointes & Analyse de fichiers",
        description: "L'ajout de documents, images et fichiers pour analyse avec Banza AI nécessite un compte utilisateur.",
        benefits: [
          "Analyse de documents (PDF, Word, TXT, CSV, JSON...)",
          "Reconnaissance et analyse d'images par vision IA",
          "Sauvegarde et historique complet de vos échanges",
        ],
      };
    case "personalization":
      return {
        required: true,
        title: "Personnalisation de l'assistant",
        description: "Définissez vos préférences de réponse, votre ton et vos instructions personnalisées.",
        benefits: [
          "Prompts personnalisés par défaut",
          "Adaptation à votre style de travail",
        ],
      };
    case "export":
      return {
        required: true,
        title: "Exportation avancée",
        description: "Exportez vos conversations complètes en PDF, Markdown ou texte brut.",
        benefits: [
          "Export propre avec citations et code",
          "Partage en un clic",
        ],
      };
    default:
      return {
        required: false,
        title: "Fonctionnalité Banza AI",
        description: "Créez un compte pour profiter de l'ensemble des fonctionnalités.",
        benefits: ["Quota élargi", "Historique permanent"],
      };
  }
}

/** Conserve le message que l'utilisateur tentait d'envoyer avant le blocage du quota */
export function savePendingMessage(text: string): void {
  if (typeof window === "undefined") return;
  try {
    if (text.trim()) {
      window.sessionStorage.setItem(PENDING_MSG_KEY, text.trim());
    } else {
      window.sessionStorage.removeItem(PENDING_MSG_KEY);
    }
  } catch {
    // stockage non disponible
  }
}

export function getPendingMessage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(PENDING_MSG_KEY);
  } catch {
    return null;
  }
}

export function clearPendingMessage(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_MSG_KEY);
  } catch {
    // ignore
  }
}

export function saveGuestToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(GUEST_TOKEN_KEY, token);
    }
  } catch {
    // ignore
  }
}

export function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearGuestToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch {
    // ignore
  }
}
