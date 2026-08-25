"use client";

import { useCallback, useEffect, useState } from "react";
import { IconSearch } from "@/components/icons";
import { adminApi } from "@/lib/api";
import type { AdminUserRow } from "@/lib/api";

export default function AdminUsers() {
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback((q: string) => {
    adminApi
      .users(q)
      .then((r) => {
        setRows(r.users);
        setTotal(r.total);
      })
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  // Recherche débouncée
  useEffect(() => {
    const t = setTimeout(() => load(query.trim()), query ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function act(id: number, patch: { role?: "user" | "admin"; status?: "active" | "suspended" }) {
    setBusyId(id);
    setNotice(null);
    try {
      await adminApi.updateUser(id, patch);
      load(query.trim());
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(u: AdminUserRow) {
    if (!confirm(`Supprimer définitivement « ${u.name} » et toutes ses conversations ?`)) return;
    setBusyId(u.id);
    try {
      await adminApi.deleteUser(u.id);
      load(query.trim());
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Utilisateurs</h1>
          <p className="mt-1 text-[15px] text-ink-2">
            {rows === null ? "Chargement…" : `${total} compte(s) enregistré(s)`}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <IconSearch width={15} height={15} className="pointer-events-none absolute left-3 top-2.5 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou e-mail…"
            aria-label="Rechercher un utilisateur"
            className="input pl-9"
          />
        </div>
      </div>

      {notice && (
        <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {notice}
        </p>
      )}

      <div className="mt-4 card overflow-x-auto">
        {!rows ? (
          <p className="px-6 py-10 text-center text-sm text-ink-3">Chargement des utilisateurs…</p>
        ) : rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-3">Aucun utilisateur trouvé.</p>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left">
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Utilisateur</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Rôle</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Statut</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Conv.</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Inscription</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Activité</th>
                <th className="px-4 py-2.5 text-right text-[12px] font-semibold text-ink-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const isGuest = u.is_guest === true || u.is_guest === 1;
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} className="border-b border-line last:border-0 hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${isGuest ? "bg-surface-2 text-ink-3" : "bg-accent-soft text-accent"}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{u.name}</p>
                          <p className="truncate text-[11.5px] text-ink-3">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={u.role === "admin" ? "badge-accent" : "badge"}>
                        {u.role === "admin" ? "Admin" : isGuest ? "Invité" : "Utilisateur"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={u.status === "active" ? "badge-success" : "badge-danger"}>
                        {u.status === "active" ? "Actif" : "Suspendu"}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink-2">{u.conversations_count}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-2">{shortDate(u.created_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-2">{u.last_active_at ? shortDate(u.last_active_at) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {!isGuest && u.role !== "admin" && (
                          <RowBtn disabled={busy} onClick={() => act(u.id, { role: "admin" })}>Promouvoir</RowBtn>
                        )}
                        {!isGuest && u.role === "admin" && (
                          <RowBtn disabled={busy} onClick={() => act(u.id, { role: "user" })}>Rétrograder</RowBtn>
                        )}
                        {!isGuest && u.status === "active" && (
                          <RowBtn disabled={busy} onClick={() => act(u.id, { status: "suspended" })}>Suspendre</RowBtn>
                        )}
                        {!isGuest && u.status === "suspended" && (
                          <RowBtn disabled={busy} onClick={() => act(u.id, { status: "active" })}>Réactiver</RowBtn>
                        )}
                        {!isGuest && (
                          <RowBtn disabled={busy} tone onClick={() => remove(u)}>Supprimer</RowBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-3">
        Les invités sont des sessions anonymes créées automatiquement pour discuter sans compte.
        Par sécurité, un administrateur ne peut pas modifier son propre rôle ni son statut.
      </p>
    </div>
  );
}

function RowBtn({
  children, onClick, disabled, tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition disabled:opacity-40 ${
        tone ? "text-danger hover:bg-danger/10" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" });
  } catch {
    return iso;
  }
}