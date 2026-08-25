"use client";

import { useEffect, useState } from "react";
import { IconChat, IconSearch } from "@/components/icons";
import { conversationsApi } from "@/lib/api";
import type { Conversation } from "@/lib/types";

export default function AdminConversations() {
  const [convs, setConvs] = useState<Conversation[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    conversationsApi.list().then(({ conversations }) => setConvs(conversations)).catch(() => setConvs([]));
  }, []);

  const q = query.trim().toLowerCase();
  const visible = convs?.filter((c) => !q || c.title.toLowerCase().includes(q));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Conversations</h1>
      <p className="mt-1 text-[15px] text-ink-2">Toutes les conversations de la plateforme.</p>

      <div className="mt-5 relative">
        <IconSearch width={15} height={15} className="pointer-events-none absolute left-3 top-2.5 text-ink-3" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="input pl-9" />
      </div>

      <div className="mt-4 card overflow-hidden">
        {!convs ? (
          <Empty text="Chargement…" />
        ) : convs.length === 0 ? (
          <Empty text="Aucune donnée — le backend n&apos;a renvoyé aucune conversation." />
        ) : (
          <ul className="divide-y divide-line">
            {visible?.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{c.title}</p>
                  <p className="text-xs text-ink-3">
                    id {c.id} · modèle {c.model || "—"} · {shortDate(c.updated_at)}
                  </p>
                </div>
                <span className="badge">Utilisateur #{c.user_id ?? "?"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-10">
      <IconChat width={26} height={26} className="text-ink-3" />
      <p className="mt-3 text-sm text-ink-2">{text}</p>
    </div>
  );
}

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}