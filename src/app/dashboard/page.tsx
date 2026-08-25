"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import {
  IconActivity,
  IconArrowRight,
  IconChat,
  IconCpu,
  IconDashboard,
  IconPlus,
  IconSettings,
  IconSparkles,
} from "@/components/icons";
import { authApi, conversationsApi, healthApi } from "@/lib/api";
import type { ConversationItem, UsageInfo, User } from "@/lib/types";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [messagesCount, setMessagesCount] = useState<number | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        return conversationsApi.list();
      })
      .then((convRes) => {
        if (cancelled || !convRes) return;
        const conversations = convRes.conversations ?? [];
        const mapped = conversations.slice(0, 50).map<ConversationItem>((c) => ({
          id: String(c.id),
          title: c.title,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          model: c.model,
        }));
        setItems(mapped);

        const ids = conversations.slice(0, 20).map((c) => c.id);
        return Promise.all(ids.map((id) => conversationsApi.get(id).catch(() => null))).then(
          (results) => {
            if (!cancelled) {
              setMessagesCount(
                results.reduce((sum, r) => sum + (r?.conversation?.messages.length ?? 0), 0)
              );
            }
          }
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    healthApi
      .status()
      .then(({ model }) => {
        if (!cancelled) setActiveModel(model ?? null);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const isGuest = !user;
  const firstName = user && !user.is_guest ? user.name.split(" ")[0] : null;

  const used = usage?.used ?? (isGuest ? 0 : (user?.usage?.used ?? 0));
  const limit = usage?.limit ?? (isGuest ? 10 : (user?.usage?.limit ?? 200));
  const remaining = usage?.remaining ?? Math.max(0, limit - used);

  const stats = [
    {
      label: "Conversations",
      value: items.length,
      sub: loading ? "…" : isGuest ? "temporaires sur cet appareil" : "sauvegardées dans le cloud",
      icon: <IconChat width={18} height={18} />,
    },
    {
      label: isGuest ? "Messages aujourd'hui" : "Messages échangés",
      value: isGuest ? `${used} / ${limit}` : (messagesCount ?? used),
      sub: isGuest ? `${remaining} restant(s) aujourd'hui` : `${used}/${limit} messages aujourd'hui`,
      icon: <IconActivity width={18} height={18} />,
    },
    {
      label: "Modèle actif",
      value: activeModel ?? "—",
      sub: activeModel ? "LLM Connecté" : "Serveur par défaut",
      icon: <IconCpu width={18} height={18} />,
    },
  ];

  return (
    <main className="min-h-dvh bg-canvas">
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(var(--accent)/0.12),transparent)]" />
      <div className="relative mx-auto max-w-5xl px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between gap-3 border-b border-line/60 pb-5">
          <Link href="/" className="flex items-center" aria-label="Banza AI — accueil">
            <BrandLogo height={28} />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/" className="btn-subtle gap-2 py-2 px-3.5 text-xs font-semibold">
              <IconChat width={15} height={15} />
              Ouvrir le Chat
            </Link>
            <Link href="/settings" className="icon-btn text-ink-2 hover:bg-surface-2" aria-label="Paramètres">
              <IconSettings width={18} height={18} />
            </Link>
            <ThemeToggle />
          </nav>
        </header>

        <section className="welcome-enter mt-10 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-ink-2 shadow-sm mb-3">
            {isGuest ? (
              <>
                <IconSparkles width={13} height={13} className="text-accent" />
                <span>Mode invité · {used} / {limit} messages</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-success" />
                <span>{user.is_admin ? "Administrateur" : "Compte Banza Gratuit"}</span>
              </>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {greeting}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-ink-2">
            {isGuest
              ? "Bienvenue sur votre espace invité. Vos conversations actuelles sont conservées localement."
              : "Bienvenue sur votre espace Banza AI. Suivez votre activité et reprenez facilement vos conversations."}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link href="/" className="btn-primary gap-2 px-6 py-2.5 shadow-sm">
              <IconPlus width={16} height={16} />
              Nouvelle discussion
            </Link>
            {items.length > 0 && (
              <span className="badge">Dernière : {items[0].title.slice(0, 35)}</span>
            )}
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="card p-6 transition hover:shadow-card-hover">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink-2 uppercase tracking-wide">{s.label}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  {s.icon}
                </span>
              </div>
              <p className="mt-3 truncate text-2xl font-bold tracking-tight text-ink" title={typeof s.value === "string" ? s.value : undefined}>
                {typeof s.value === "number" ? s.value.toLocaleString("fr-FR") : s.value}
              </p>
              <p className="mt-1 text-xs text-ink-3">{s.sub}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-ink">Conversations récentes</h2>
            <Link href="/" className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline">
              <span>Voir dans le chat</span>
              <IconArrowRight width={14} height={14} />
            </Link>
          </div>

          {!loading && items.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <IconChat width={22} height={22} />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">Aucune conversation</p>
              <p className="mt-1 max-w-xs text-[13px] text-ink-3">
                Lancez votre première discussion depuis le chat.
              </p>
              <Link href="/" className="btn-soft mt-4 gap-2 px-4 py-2 text-xs">
                <span>Commencer</span>
                <IconArrowRight width={14} height={14} />
              </Link>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {items.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href="/" className="card flex items-center justify-between px-5 py-3.5 transition hover:border-accent hover:bg-accent-soft/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{c.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-3">{formatDate(c.updatedAt)}</p>
                    </div>
                    <IconArrowRight width={16} height={16} className="ml-3 shrink-0 text-ink-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* CTA compte pour invités */}
        {!loading && isGuest && (
          <section className="mt-10 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <div className="bg-[linear-gradient(135deg,rgb(var(--accent)/0.12),transparent_60%)] p-7">
              <h3 className="text-base font-bold text-ink">Conservez vos conversations dans le cloud</h3>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-ink-2">
                Vous utilisez actuellement Banza AI en mode invité ({used} / {limit} messages consommés aujourd&apos;hui). Créez un compte gratuit
                pour débloquer 200 messages quotidiens et synchroniser votre historique sur tous vos appareils.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <Link href="/register" className="btn-primary px-5 py-2.5">Créer un compte gratuit</Link>
                <Link href="/login" className="btn-subtle px-5 py-2.5">Se connecter</Link>
              </div>
            </div>
          </section>
        )}

        {/* Espace admin pour administrateurs */}
        {!loading && user?.is_admin && (
          <section className="mt-8 flex items-center justify-between rounded-2xl border border-line bg-surface px-6 py-4 shadow-card">
            <div>
              <p className="text-sm font-bold text-ink">Espace administration</p>
              <p className="text-[12.5px] text-ink-3">Statistiques, utilisateurs, sessions invités et modèles IA.</p>
            </div>
            <Link href="/admin" className="btn-subtle gap-2 py-2 text-xs font-semibold">
              <IconDashboard width={15} height={15} />
              Ouvrir l&apos;Admin
            </Link>
          </section>
        )}

        <footer className="py-10 text-center text-xs text-ink-3">
          Banza AI · Assistant conversationnel intelligent
        </footer>
      </div>
    </main>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (d.getTime() >= today) return "Aujourd'hui";
    if (d.getTime() >= today - 86_400_000) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}