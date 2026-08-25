// ============================================================
// Banza AI — Guest Mode
// Persistance locale temporaire des conversations invitées.
// Aucun backend requis : ces données restent dans le navigateur.
// ============================================================

export interface GuestMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model?: string | null;
}

export interface GuestConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: GuestMessage[];
}

const STORAGE_KEY = "banza.guest.v1";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadGuestConversations(): GuestConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Sauvegarde explicite de la liste des conversations invitées. */
export function saveGuestConversations(convs: GuestConversation[]): void {
  persist(convs);
}

function persist(convs: GuestConversation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch {
    // quota dépassé ou stockage indisponible
  }
}

export function createGuestConversation(
  convs: GuestConversation[],
  title = "Nouvelle conversation"
): { list: GuestConversation[]; conversation: GuestConversation } {
  const now = new Date().toISOString();
  const conversation: GuestConversation = {
    id: uid(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  const list = [conversation, ...convs].slice(0, 200); // garde-fou mémoire
  persist(list);
  return { list, conversation };
}

export function updateGuestConversation(
  convs: GuestConversation[],
  id: string,
  patch: Partial<GuestConversation>
): GuestConversation[] {
  const list = convs.map((c) =>
    c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
  );
  persist(list);
  return list;
}

export function appendGuestMessage(
  convs: GuestConversation[],
  conversationId: string,
  message: GuestMessage
): GuestConversation[] {
  return updateGuestConversation(convs, conversationId, {
    messages: [...(convs.find((c) => c.id === conversationId)?.messages ?? []), message],
  });
}

export function deleteGuestConversation(
  convs: GuestConversation[],
  id: string
): GuestConversation[] {
  const list = convs.filter((c) => c.id !== id);
  persist(list);
  return list;
}

import type { ConversationItem } from "./types";

export function toConversationItems(gc: GuestConversation[]): ConversationItem[] {
  return gc.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    model: null,
    isLocal: true,
  }));
}

export const GUEST_NOTICE =
  "🛡️ **Mode invité** — vous explorez Banza AI sans compte. Vos conversations sont conservées sur cet appareil. Créez un compte gratuit pour les sauvegarder dans le cloud, les synchroniser et activer l'assistant sur vos autres appareils.";

export function guestWelcomeReply(): string {
  return [
    "Bienvenue sur **Banza AI** 👋",
    "",
    "Vous êtes en *mode invité* : l'interface complète est à votre disposition, avec vos conversations conservées localement sur cet appareil — aucune inscription requise pour explorer.",
    "",
    "Pour profiter des réponses générées par nos modèles LLM (NVIDIA) et les enregistrer définitivement, **créez votre compte gratuit** puis connectez-vous. Vos conversations invitées pourront être reprises à la connexion.",
    "",
    "Commencez par explorer : posez une question, ajoutez un fichier, ou laissez-vous guider par les suggestions d'accueil.",
  ].join("\n");
}

export function guestIntro(): string {
  return GUEST_NOTICE + "\n\n" + guestWelcomeReply();
}

/** Met à jour (ou remplace) le contenu du dernier message assistant d'une conversation invité. */
export function updateLastAssistant(
  list: GuestConversation[],
  conversationId: string,
  updater: (content: string) => string
): GuestConversation[] {
  const next = list.map((c) => {
    if (c.id !== conversationId) return c;
    const msgs = c.messages.map((m, i, arr) =>
      i === arr.length - 1 && m.role === "assistant"
        ? { ...m, content: updater(m.content) }
        : m
    );
    return { ...c, messages: msgs, updatedAt: new Date().toISOString() };
  });
  persist(next);
  return next;
}

/** Titre généré à partir du premier message utilisateur */
export function guessTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "Nouvelle conversation";
  return clean.length > 52 ? `${clean.slice(0, 52)}…` : clean;
}

/** Dates groupées pour la sidebar */
export type GroupKey = "today" | "yesterday" | "week" | "older";

export function groupKeyOf(dateIso: string): GroupKey {
  const d = new Date(dateIso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86_400_000;
  const startWeek = startToday - 7 * 86_400_000;
  const t = d.getTime();
  if (t >= startToday) return "today";
  if (t >= startYesterday) return "yesterday";
  if (t >= startWeek) return "week";
  return "older";
}