import { useEffect, useState } from "react";
import { IconLogs } from "@/components/icons";
import { adminApi, type ActivityLogRow } from "@/lib/api";

const LEVELS = ["tous", "info", "warn", "error"] as const;

export default function AdminLogs() {
  const [logs, setLogs] = useState<ActivityLogRow[] | null>(null);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("tous");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    adminApi
      .logs(limit)
      .then(({ logs: l }) => setLogs(l))
      .catch(() => setLogs([]));
  }, [limit]);

  const q = query.trim().toLowerCase();
  const visible = logs?.filter((l) => {
    if (level !== "tous" && l.level !== level) return false;
    if (!q) return true;
    return (
      l.message.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      (l.user_email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Journal d&apos;activité</h1>
      <p className="mt-1 text-[15px] text-ink-2">
        Connexions, inscriptions, sessions invitées et actions administrateur.
      </p>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans les journaux…"
          className="input flex-1"
          aria-label="Rechercher dans les journaux"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}
          className="input w-auto"
          aria-label="Niveau de gravité"
        >
          {LEVELS.map((lv) => (
            <option key={lv} value={lv}>
              {lv === "tous" ? "Tous niveaux" : lv.toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="input w-auto"
          aria-label="Nombre de lignes"
        >
          {[50, 100, 250].map((n) => (
            <option key={n} value={n}>{n} lignes</option>
          ))}
        </select>
      </div>

      <div className="mt-4 card overflow-hidden">
        {!logs ? (
          <p className="px-6 py-10 text-center text-sm text-ink-3">Chargement des journaux…</p>
        ) : !visible || visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12">
            <IconLogs width={24} height={24} className="text-ink-3" />
            <p className="mt-3 text-sm text-ink-2">Aucun évènement pour ce filtre.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((l) => (
              <li key={l.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-2/50">
                <span className={`mt-0.5 badge ${l.level === "error" ? "badge-danger" : l.level === "warn" ? "border-warning/30 bg-warning/10 text-warning" : ""}`}>
                  {l.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">{l.message}</p>
                  <p className="mt-0.5 text-[11px] text-ink-3">
                    {l.user_name ?? "système"}
                    {l.ip ? ` · ${l.ip}` : ""}
                  </p>
                </div>
                <time className="shrink-0 whitespace-nowrap pt-0.5 text-[11px] tabular-nums text-ink-3">
                  {new Date(l.created_at.replace(" ", "T")).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
