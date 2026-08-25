"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import ChatInput from "./ChatInput";
import GuestLimitModal from "./GuestLimitModal";
import MessageBubble from "./MessageBubble";
import Sidebar from "./Sidebar";
import WelcomeScreen from "./WelcomeScreen";
import {
  IconArrowUpRight,
  IconGlobe,
  IconMenu,
  IconPlus,
  IconSparkles,
} from "./icons";
import {
  authApi,
  conversationsApi,
  guestApi,
  streamChat,
  ApiError,
  type ChatSource,
} from "@/lib/api";
import {
  clearPendingMessage,
  getPendingMessage,
  requiresAuthentication,
  savePendingMessage,
} from "@/lib/auth-gate";
import type {
  AuthFeature,
  ChatMessage,
  ConversationItem,
  UsageInfo,
  User,
} from "@/lib/types";

/** Déduplication par id réel */
function dedupeMessages<T extends { id?: string | number; role: string; content: string }>(
  list: T[]
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const m of list) {
    const key =
      m.id !== undefined && m.id !== null
        ? `db-${String(m.id)}`
        : `${m.role}|${m.content.slice(0, 48)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

export default function ChatShell() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [pendingText, setPendingText] = useState<string>("");

  // État de la boîte modale de conversion Guest -> Compte
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title?: string;
    description?: string;
    benefits?: string[];
    featureGate?: boolean;
  }>({});

  const abortRef = useRef<AbortController | null>(null);
  const userStopRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const streamingRef = useRef(false);
  const isGuest = !user;

  const [searching, setSearching] = useState(false);
  const deltaBufferRef = useRef<string>("");
  const flushRafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const setActiveConversation = useCallback((id: string | null) => {
    activeIdRef.current = id;
    setActiveId(id);
  }, []);

  const mapItems = (list: { id: number; title: string; created_at: string; updated_at: string; model: string | null }[]) =>
    list.map<ConversationItem>((c) => ({
      id: String(c.id),
      title: c.title,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      model: c.model,
    }));

  // Initialisation session utilisateur / invité et reprise des données
  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((res) => {
        if (cancelled) return;
        if (res.user) {
          setUser(res.user);
          if (res.user.usage) setUsage(res.user.usage);
        } else if (res.guest) {
          setUser(null);
          setUsage(res.guest.usage);
        }

        // Chargement des conversations (utilisateur ou session invité)
        return conversationsApi.list().then(({ conversations }) => {
          if (cancelled) return;
          const mapped = mapItems(conversations);
          setItems(mapped);
          if (mapped.length > 0 && !activeIdRef.current) {
            setActiveConversation(mapped[0].id);
          }

          // Vérification si un message était en attente après inscription
          const pending = getPendingMessage();
          if (pending) {
            setPendingText(pending);
            clearPendingMessage();
          }
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Erreur de connexion à Banza.");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [setActiveConversation]);

  // Chargement des messages de la conversation active
  useEffect(() => {
    if (streamingRef.current) return;
    if (activeId === null) {
      setMessages([]);
      return;
    }
    const num = Number(activeId);
    if (!Number.isFinite(num)) return;

    conversationsApi
      .get(num)
      .then(({ conversation }) => {
        setMessages(dedupeMessages(conversation.messages));
      })
      .catch((e) => {
        setError(e instanceof ApiError ? e.message : "Impossible de charger la conversation.");
      });
  }, [activeId]);

  // Auto-scroll fluide
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, searching]);

  const refreshConversations = useCallback(async () => {
    try {
      const { conversations } = await conversationsApi.list();
      setItems(mapItems(conversations));
    } catch {
      /* ignore */
    }
  }, []);

  const handleStop = useCallback(() => {
    userStopRef.current = true;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    streamingRef.current = false;
    setGenerating(false);
    setSearching(false);
  }, []);

  // Déclenchement de la modale de restriction de fonctionnalité (feature gating)
  const triggerFeatureGate = useCallback((feature: AuthFeature) => {
    const req = requiresAuthentication(feature);
    setModalConfig({
      title: req.title,
      description: req.description,
      benefits: req.benefits,
      featureGate: true,
    });
    setLimitModalOpen(true);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || generating) return;

      // 1. Vérification préventive du quota invité
      if (isGuest && usage && usage.remaining <= 0 && usage.used >= usage.limit) {
        savePendingMessage(trimmed);
        setPendingText(trimmed);
        setModalConfig({
          title: "Limite invité atteinte",
          description:
            "Vous avez atteint la limite d'utilisation gratuite en mode invité (10 messages par jour). Créez gratuitement votre compte pour envoyer ce message et continuer.",
          featureGate: false,
        });
        setLimitModalOpen(true);
        return;
      }

      setError(null);
      setGenerating(true);
      userStopRef.current = false;

      const convId = activeId ? Number(activeId) : null;
      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed },
        { role: "assistant", content: "", sources: [] },
      ]);

      streamingRef.current = true;
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChat(
          trimmed,
          convId,
          {
            onMeta: ({ conversation_id, usage: metaUsage }) => {
              setActiveConversation(String(conversation_id));
              setSearching(false);
              if (metaUsage) setUsage(metaUsage);
            },
            onSearching: () => setSearching(true),
            onSources: (sources: ChatSource[]) =>
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") next[next.length - 1] = { ...last, sources };
                return next;
              }),
            onDelta: (delta) => {
              deltaBufferRef.current += delta;
              if (flushRafRef.current === null) {
                flushRafRef.current = requestAnimationFrame(() => {
                  const buffered = deltaBufferRef.current;
                  deltaBufferRef.current = "";
                  flushRafRef.current = null;
                  if (buffered === "") return;
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === "assistant")
                      next[next.length - 1] = { ...last, content: last.content + buffered };
                    return next;
                  });
                });
              }
            },
            onDone: ({ usage: doneUsage }) => {
              if (doneUsage) setUsage(doneUsage);
            },
            onError: (message, code, errUsage) => {
              if (errUsage) setUsage(errUsage);
              if (code === "GUEST_LIMIT_REACHED") {
                savePendingMessage(trimmed);
                setPendingText(trimmed);
                setModalConfig({
                  title: "Limite invité atteinte",
                  description: message,
                  featureGate: false,
                });
                setLimitModalOpen(true);
              } else {
                setError(message);
              }
            },
          },
          controller.signal
        );
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          const apiErr = e as ApiError;
          if (apiErr.code === "GUEST_LIMIT_REACHED") {
            savePendingMessage(trimmed);
            setPendingText(trimmed);
            setModalConfig({
              title: "Limite invité atteinte",
              description: apiErr.message,
              featureGate: false,
            });
            setLimitModalOpen(true);
          } else {
            setError(apiErr.message ?? "Impossible de contacter Banza.");
          }
        }
      } finally {
        if (flushRafRef.current !== null) {
          cancelAnimationFrame(flushRafRef.current);
          flushRafRef.current = null;
        }
        const remaining = deltaBufferRef.current;
        deltaBufferRef.current = "";
        if (remaining) {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant")
              next[next.length - 1] = { ...last, content: last.content + remaining };
            return next;
          });
        }
        streamingRef.current = false;
        setGenerating(false);
        setSearching(false);
        abortRef.current = null;

        const finalConvId = activeIdRef.current;
        if (finalConvId && !userStopRef.current) {
          try {
            const { conversation } = await conversationsApi.get(Number(finalConvId));
            setMessages(dedupeMessages(conversation.messages));
          } catch {
            /* ignore */
          }
        }
        refreshConversations().catch(() => undefined);
      }
    },
    [isGuest, usage, activeId, generating, refreshConversations, setActiveConversation]
  );

  const handleNew = useCallback(() => {
    if (generating) handleStop();
    setActiveConversation(null);
    setMessages([]);
    setError(null);
  }, [generating, handleStop, setActiveConversation]);

  const handleRename = useCallback(
    async (id: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      try {
        await conversationsApi.rename(Number(id), newTitle.trim());
        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim() } : c))
        );
      } catch {
        setError("Impossible de renommer la conversation.");
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await conversationsApi.remove(Number(id));
      } catch {
        setError("Impossible de supprimer la conversation.");
        return;
      }
      setItems((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) {
        setActiveConversation(null);
        setMessages([]);
      }
    },
    [activeId, setActiveConversation]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      // Réinitialisation en mode invité propre
      guestApi.usage().then((g) => {
        setUsage(g.usage);
        setItems([]);
        setActiveConversation(null);
        setMessages([]);
      });
      router.replace("/");
    }
  }, [router, setActiveConversation]);

  const handleRegenerate = useCallback(() => {
    if (generating) return;
    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (lastUser) handleSend(lastUser.content);
  }, [messages, generating, handleSend]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-accent/25 border-t-accent" />
      </div>
    );
  }

  const activeConversation = items.find((c) => c.id === activeId);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <div className="flex min-h-0 flex-1">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          items={items}
          activeId={activeId}
          usage={usage}
          onSelect={(id) => {
            setActiveConversation(id);
            setError(null);
          }}
          onNew={handleNew}
          onRename={handleRename}
          onDelete={handleDelete}
          onLogout={handleLogout}
          onRequestAuth={triggerFeatureGate}
        />

        <div className="flex min-w-0 flex-1 flex-col bg-canvas">
          {/* Barre supérieure épurée */}
          <header className="flex items-center gap-2 border-b border-line/70 bg-surface/80 px-4 py-2.5 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-ink-2 hover:bg-surface-2 md:hidden"
              aria-label="Ouvrir le menu"
            >
              <IconMenu width={20} height={20} />
            </button>

            <Link href="/" className="flex items-center">
              <BrandLogo height={24} className="hidden md:flex" />
            </Link>

            <div className="min-w-0 flex-1 truncate text-center">
              <span className="truncate text-sm font-bold tracking-tight text-ink">
                {activeConversation?.title ?? (messages.length ? "Conversation" : "Nouvelle conversation")}
              </span>
              {generating && (
                <span className="ml-2 text-xs font-medium text-accent animate-pulse">
                  · En génération…
                </span>
              )}
            </div>

            {/* Indicateur de quota discret dans l'en-tête */}
            {isGuest && usage && (
              <button
                type="button"
                onClick={() => triggerFeatureGate("history")}
                className="hidden sm:inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink-2 shadow-sm transition hover:border-accent hover:text-accent"
                title="Consultez votre quota invité"
              >
                <IconSparkles width={12} height={12} className="text-accent" />
                <span>Invité {usage.used}/{usage.limit}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNew}
              className="icon-btn rounded-xl text-ink-2 hover:bg-surface-2 md:hidden"
              aria-label="Nouvelle conversation"
              title="Nouvelle conversation"
            >
              <IconPlus width={18} height={18} />
            </button>

            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-2 shadow-sm transition hover:border-accent hover:text-ink md:flex"
            >
              <span>Tableau de bord</span>
              <IconArrowUpRight width={14} height={14} className="text-ink-3" />
            </Link>
          </header>

          {/* Corps de conversation */}
          <main className="scroll-thin flex-1 overflow-y-auto overscroll-contain">
            {messages.length === 0 ? (
              <div className="flex min-h-full flex-1">
                <WelcomeScreen onSend={handleSend} />
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
                {messages.map((m, i) => {
                  const isLastAssistant = m.role === "assistant" && i === messages.length - 1;
                  return (
                    <MessageBubble
                      key={m.id ?? `msg-${i}`}
                      message={m}
                      streaming={generating && isLastAssistant}
                      onRegenerate={handleRegenerate}
                    />
                  );
                })}
                <div ref={bottomRef} className="h-4" />
              </div>
            )}
          </main>

          {/* Indicateur de recherche web en temps réel */}
          {searching && (
            <div className="mx-auto mb-2 w-full max-w-3xl px-4 sm:px-6">
              <p className="flex items-center justify-center gap-2 rounded-2xl border border-accent/25 bg-accent-soft px-4 py-2.5 text-[13.5px] font-semibold text-accent shadow-sm animate-pulse-soft">
                <IconGlobe width={16} height={16} className="animate-spin-slow" />
                Banza consulte des sources web récentes…
              </p>
            </div>
          )}

          {/* Bandeau invité discret */}
          {isGuest && (
            <div className="mx-auto mb-1 w-full max-w-3xl px-4 text-center">
              <p className="text-[11.5px] text-ink-3">
                Mode invité actif ({usage?.used ?? 0}/{usage?.limit ?? 10} messages) —{" "}
                <Link
                  href="/register"
                  className="font-semibold text-accent hover:underline"
                >
                  Créez un compte gratuit
                </Link>{" "}
                pour sauvegarder vos échanges.
              </p>
            </div>
          )}

          {/* Affichage d'erreur */}
          {error && (
            <div className="mx-auto mb-2 w-full max-w-3xl px-4 sm:px-6">
              <p role="alert" className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger shadow-sm">
                {error}
              </p>
            </div>
          )}

          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            generating={generating}
            initialValue={pendingText}
            onAttachmentClick={() => triggerFeatureGate("advanced_files")}
          />
        </div>
      </div>

      {/* Boîte Modale Plein Écran / Responsive de Limite Quota & Compte Requis */}
      <GuestLimitModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        title={modalConfig.title}
        description={modalConfig.description}
        benefits={modalConfig.benefits}
        usage={usage}
        featureGate={modalConfig.featureGate}
      />
    </div>
  );
}
