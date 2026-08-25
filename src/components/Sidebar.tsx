"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo, UserAvatar } from "./BrandLogo";
import ThemeToggle from "./ThemeToggle";
import {
  IconChat,
  IconDashboard,
  IconEdit,
  IconLogout,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconTrash,
  IconX,
} from "./icons";
import { groupKeyOf } from "@/lib/guest";
import type { ConversationItem, UsageInfo, User } from "@/lib/types";

const GROUP_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "7 derniers jours",
  older: "Plus ancien",
};

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  items: ConversationItem[];
  activeId: string | null;
  usage?: UsageInfo | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
  onRequestAuth?: (feature: "history" | "save_conversation" | "export") => void;
}

export default function Sidebar({
  open,
  onClose,
  user,
  items,
  activeId,
  usage,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onLogout,
  onRequestAuth,
}: Props) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const isGuest = !user;
  const usedMessages = usage?.used ?? (isGuest ? 0 : (user.usage?.used ?? 0));
  const limitMessages = usage?.limit ?? (isGuest ? 10 : (user.usage?.limit ?? 50));
  const remainingMessages = usage?.remaining ?? Math.max(0, limitMessages - usedMessages);
  const pct = Math.min(100, Math.round((usedMessages / limitMessages) * 100));
  const isNearLimit = isGuest && remainingMessages <= 2 && remainingMessages > 0;
  const isLimitReached = isGuest && remainingMessages === 0 && usedMessages >= limitMessages;

  const filtered = query.trim()
    ? items.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  const groups: Record<string, ConversationItem[]> = {};
  for (const item of filtered) {
    const key = groupKeyOf(item.updatedAt);
    (groups[key] ??= []).push(item);
  }
  const order = ["today", "yesterday", "week", "older"];

  function submitRename() {
    if (editingId !== null && editTitle.trim()) onRename(editingId, editTitle.trim());
    setEditingId(null);
  }

  const body = (
    <div className="flex h-full flex-col bg-surface/95 backdrop-blur-xl border-r border-line">
      {/* En-tête Sidebar avec Logo officiel */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-line/60">
        <Link href="/" className="shrink-0 flex items-center" aria-label="Banza — accueil">
          <BrandLogo height={26} />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-ink-3 hover:bg-surface-2 md:hidden"
            aria-label="Fermer la navigation"
          >
            <IconX width={18} height={18} />
          </button>
        </div>
      </div>

      {/* Bouton Nouvelle Conversation */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => {
            onNew();
            onClose();
          }}
          className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 shadow-sm text-[13.5px]"
        >
          <IconPlus width={16} height={16} />
          Nouvelle conversation
        </button>
      </div>

      {/* Recherche */}
      <div className="px-3 pt-2.5">
        <div className="relative">
          <IconSearch width={14} height={14} className="pointer-events-none absolute left-3 top-2.5 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher une conversation"
            className="input pl-8.5 py-1.5 text-[13px] rounded-xl"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <nav className="scroll-thin mt-2 flex-1 overflow-y-auto px-3 pb-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-[12.5px] text-ink-3">
            {query.trim() ? "Aucune conversation correspondante." : "Aucune conversation récente."}
          </p>
        ) : (
          order.map((key) => {
            const list = groups[key];
            if (!list?.length) return null;
            return (
              <div key={key} className="mt-2.5">
                <p className="px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">
                  {GROUP_LABELS[key]}
                </p>
                <ul className="mt-0.5 space-y-0.5">
                  {list.map((c) => {
                    const active = c.id === activeId;
                    const isEditing = editingId === c.id;

                    if (isEditing) {
                      return (
                        <li key={c.id} className="px-1 py-0.5">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              submitRename();
                            }}
                            className="flex items-center gap-1"
                          >
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={submitRename}
                              className="input py-1 text-xs"
                            />
                          </form>
                        </li>
                      );
                    }

                    return (
                      <li key={c.id} className="group relative">
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(c.id);
                            onClose();
                          }}
                          className={`nav-item text-left ${active ? "active" : ""}`}
                        >
                          <IconChat width={14} height={14} className={`shrink-0 ${active ? "text-accent" : "text-ink-3"}`} />
                          <span className="min-w-0 flex-1 truncate text-[13px]">{c.title}</span>
                        </button>
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 group-hover:flex bg-surface-2/90 rounded-lg p-0.5 shadow-sm">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(c.id);
                              setEditTitle(c.title);
                            }}
                            className="rounded p-1 text-ink-3 hover:text-ink transition"
                            title="Renommer"
                          >
                            <IconEdit width={12} height={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(c.id);
                            }}
                            className="rounded p-1 text-ink-3 hover:text-danger transition"
                            title="Supprimer"
                          >
                            <IconTrash width={12} height={12} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </nav>

      {/* Jauge de Quota et Pied de Sidebar */}
      <div className="border-t border-line/60 p-3 space-y-2.5">
        {/* Jauge Quota Invité / Utilisateur */}
        {isGuest ? (
          <div className="rounded-xl border border-line/70 bg-surface-2/60 p-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-ink">
              <span className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
                <IconSparkles width={13} height={13} className="text-accent" />
                Mode invité
              </span>
              <span className="text-[12px] font-bold text-accent">
                {usedMessages} / {limitMessages}
              </span>
            </div>

            {/* Barre de progression */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line/80">
              <div
                className={`h-full transition-all duration-300 ${isLimitReached
                    ? "bg-danger"
                    : isNearLimit
                      ? "bg-warning"
                      : "bg-accent"
                  }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Alerte discrète à 80% */}
            {isNearLimit && (
              <p className="mt-1.5 text-[11px] font-semibold text-warning">
                Plus que {remainingMessages} message{remainingMessages > 1 ? "s" : ""} en mode invité
              </p>
            )}

            {/* Alerte si limite atteinte */}
            {isLimitReached && (
              <p className="mt-1.5 text-[11px] font-semibold text-danger">
                Limite quotidienne atteinte (10/10)
              </p>
            )}

            <p className="mt-2 text-[10.5px] text-ink-3 leading-snug">
              Vos conversations invitées sont temporaires.
            </p>

            <div className="mt-2.5 flex flex-col gap-1.5">
              <Link
                href="/register"
                className="btn-primary w-full justify-center py-2 text-xs font-bold shadow-sm"
              >
                Créer un compte
              </Link>
              <Link
                href="/login"
                className="btn-subtle w-full justify-center py-1.5 text-xs font-medium text-ink-2"
              >
                Se connecter
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Jauge utilisateur gratuit si applicable */}
            {!user.is_admin && (
              <div className="rounded-xl border border-line/60 bg-surface-2/40 px-3 py-2 text-[11.5px]">
                <div className="flex items-center justify-between text-ink-2">
                  <span>Quota gratuit</span>
                  <span className="font-semibold text-ink">
                    {usedMessages} / {limitMessages} msg
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line/70">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-2/60 p-2 border border-line/50">
              <div className="flex min-w-0 items-center gap-2">
                <UserAvatar name={user.name} className="h-8 w-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-[10.5px] text-ink-3">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Link
                  href="/dashboard"
                  className="rounded-lg p-1.5 text-ink-3 hover:bg-surface hover:text-ink transition"
                  title="Tableau de bord"
                >
                  <IconDashboard width={15} height={15} />
                </Link>
                <Link
                  href="/settings"
                  className="rounded-lg p-1.5 text-ink-3 hover:bg-surface hover:text-ink transition"
                  title="Paramètres"
                >
                  <IconSettings width={15} height={15} />
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-lg p-1.5 text-ink-3 hover:bg-surface hover:text-danger transition"
                  title="Se déconnecter"
                >
                  <IconLogout width={15} height={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Version Desktop fixe */}
      <aside className="hidden w-64 shrink-0 md:block lg:w-72">
        {body}
      </aside>

      {/* Version Mobile en drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          <aside className="relative flex w-4/5 max-w-xs flex-col shadow-2xl animate-slide-in-right">
            {body}
          </aside>
        </div>
      )}
    </>
  );
}