import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconActivity,
  IconAlert,
  IconArrowUpRight,
  IconChat,
  IconCpu,
  IconSparkles,
  IconUsers,
} from "@/components/icons";
import { adminApi, orchestrationApi, type OrchestrationStats } from "@/lib/api";
import type { AdminStats } from "@/lib/api";

function PerfBadge({ ms, good, warn }: { ms: number | null; good: number; warn: number }) {
  if (ms === null) return <span className="text-[13px] font-medium text-ink-3">—</span>;
  const color = ms <= good ? "text-success" : ms <= warn ? "text-warning" : "text-danger";
  return <span className={`text-[13px] font-semibold tabular-nums ${color}`}>{ms} ms</span>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orch, setOrch] = useState<OrchestrationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .stats()
      .then(({ stats: s }) => setStats(s))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement."));
    orchestrationApi
      .get()
      .then(({ stats: o }) => setOrch(o))
      .catch(() => setOrch(null));
  }, []);

  const cards = stats
    ? [
        {
          label: "Utilisateurs Inscrits",
          value: String(stats.users),
          sub: `${stats.admins} admin(s) · ${stats.guests} sessions invitées`,
          icon: <IconUsers width={18} height={18} />,
        },
        {
          label: "Conversations",
          value: String(stats.conversations),
          sub: `${stats.active_today} utilisateur(s) actif(s) aujourd'hui`,
          icon: <IconChat width={18} height={18} />,
        },
        {
          label: "Messages Totaux",
          value: String(stats.messages),
          sub: `${stats.messages_today} aujourd'hui (${stats.registered_messages ?? 0} membres / ${stats.guest_messages ?? 0} invités)`,
          icon: <IconActivity width={18} height={18} />,
        },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Tableau de bord</h1>
      <p className="mt-1 text-[15px] text-ink-2">Vue d&apos;ensemble réelle de la plateforme Banza AI.</p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {stats && stats.ai === "not_configured" && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
          <IconAlert width={16} height={16} className="mt-0.5 shrink-0 text-warning" />
          <p className="text-[13px] leading-relaxed text-ink-2">
            <strong className="font-semibold text-ink">Service IA non configuré.</strong>{" "}
            Renseignez <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[12px]">NVIDIA_API_KEY</code>{" "}
            dans le fichier <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[12px]">.env</code> du backend.
          </p>
        </div>
      )}

      {/* Cartes principales */}
      <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {!stats && !error
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-28 animate-pulse bg-surface-2" />)
          : cards.map((c) => (
              <div key={c.label} className="card p-5 transition hover:shadow-card-hover">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-ink-2">{c.label}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    {c.icon}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                  {(Number(c.value) || 0).toLocaleString("fr-FR")}
                </p>
                <p className="mt-0.5 text-[11.5px] text-ink-3">{c.sub}</p>
              </div>
            ))}
      </div>

      {/* Section Guest & Taux de Conversion */}
      {stats && (
        <div className="mt-5 card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <IconSparkles width={15} height={15} />
              </span>
              <h2 className="text-base font-semibold text-ink">Tunnel Invités → Comptes (Conversions)</h2>
            </div>
            <span className="badge font-bold">
              {stats.guest_conversion_rate ?? 0}% de conversion
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Sessions Invitées</p>
              <p className="mt-1 text-lg font-bold text-ink">{stats.guests.toLocaleString("fr-FR")}</p>
              <p className="mt-0.5 text-[10.5px] text-ink-3">{stats.guest_sessions_active ?? 0} actives</p>
            </div>

            <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Comptes Convertis</p>
              <p className="mt-1 text-lg font-bold text-success">
                {(stats.guest_sessions_converted ?? 0).toLocaleString("fr-FR")}
              </p>
              <p className="mt-0.5 text-[10.5px] text-ink-3">depuis le mode invité</p>
            </div>

            <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Taux de Conversion</p>
              <p className="mt-1 text-lg font-bold text-accent">{stats.guest_conversion_rate ?? 0} %</p>
              <p className="mt-0.5 text-[10.5px] text-ink-3">invité → inscrit</p>
            </div>

            <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Messages / Invité</p>
              <p className="mt-1 text-lg font-bold text-ink">
                {stats.avg_messages_before_signup ?? 0} msg
              </p>
              <p className="mt-0.5 text-[10.5px] text-ink-3">avant création de compte</p>
            </div>
          </div>
        </div>
      )}

      {/* Modèle IA */}
      <div className="mt-5 card flex items-center justify-between p-5">
        <div>
          <p className="text-[13px] font-medium text-ink-2">Modèle IA actif</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-ink">{orch?.llm ?? stats?.model ?? "—"}</p>
        </div>
        <IconCpu width={24} height={24} className={stats?.ai === "configured" ? "text-success" : "text-warning"} />
      </div>

      {/* AI Performance */}
      <div className="mt-4 card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">⚡ AI Performance &amp; Latence</h2>
          {orch && (
            <span className="text-[11px] text-ink-3 tabular-nums">
              {orch.requests} requête{orch.requests !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!orch ? (
          <p className="mt-3 text-[13px] text-ink-3">Métriques indisponibles.</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* TTFT */}
              <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">TTFT Moyen</p>
                <div className="mt-1.5">
                  <PerfBadge ms={orch.ttft_avg_ms} good={1500} warn={3000} />
                </div>
                <p className="mt-0.5 text-[10.5px] text-ink-3">
                  {orch.ttft_min_ms !== null ? `min ${orch.ttft_min_ms}ms` : "—"}
                </p>
              </div>

              {/* Temps LLM moyen */}
              <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Temps LLM</p>
                <div className="mt-1.5">
                  <PerfBadge ms={orch.llm_avg_ms} good={3000} warn={7000} />
                </div>
                <p className="mt-0.5 text-[10.5px] text-ink-3">{orch.llm_calls} appel{orch.llm_calls !== 1 ? "s" : ""}</p>
              </div>

              {/* Temps recherche */}
              <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Web Search</p>
                <div className="mt-1.5">
                  <PerfBadge ms={orch.search_avg_ms} good={2000} warn={5000} />
                </div>
                <p className="mt-0.5 text-[10.5px] text-ink-3">{orch.search_count} recherche{orch.search_count !== 1 ? "s" : ""}</p>
              </div>

              {/* Tokens/sec */}
              <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Tokens / sec</p>
                <p className="mt-1.5 text-[13px] font-semibold text-ink">
                  {orch.tokens_per_sec !== null ? `${orch.tokens_per_sec}` : "—"}
                </p>
                <p className="mt-0.5 text-[10.5px] text-ink-3">{orch.tokens_total.toLocaleString("fr-FR")} total</p>
              </div>
            </div>

            {/* Barre de synthèse */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line/60 pt-4 sm:grid-cols-4 text-xs">
              <div>
                <span className="text-ink-3">Requêtes lentes (&gt;5s) : </span>
                <span className={`font-semibold tabular-nums ${orch.slow_requests > 0 ? "text-warning" : "text-ink"}`}>
                  {orch.slow_requests}
                </span>
              </div>
              <div>
                <span className="text-ink-3">Taux d&apos;erreur : </span>
                <span className={`font-semibold tabular-nums ${orch.error_rate_pct > 5 ? "text-danger" : "text-ink"}`}>
                  {orch.error_rate_pct}%
                </span>
              </div>
              <div>
                <span className="text-ink-3">Recherches déclenchées : </span>
                <span className="font-semibold text-ink tabular-nums">{orch.search_count}</span>
              </div>
              <div>
                <span className="text-ink-3">Sources citées : </span>
                <span className="font-semibold text-ink tabular-nums">{orch.citations_sent}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Raccourcis d'administration */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/admin/users"
          className="card flex items-center justify-between p-4 transition hover:border-accent hover:bg-accent-soft/30"
        >
          <div>
            <p className="text-sm font-semibold text-ink">Gérer les utilisateurs</p>
            <p className="text-xs text-ink-3">Consulter les comptes, rôles, statuts et sessions</p>
          </div>
          <IconArrowUpRight width={16} height={16} className="text-ink-3" />
        </Link>
        <Link
          to="/admin/models"
          className="card flex items-center justify-between p-4 transition hover:border-accent hover:bg-accent-soft/30"
        >
          <div>
            <p className="text-sm font-semibold text-ink">Catalogue des modèles IA</p>
            <p className="text-xs text-ink-3">Gérer les clés d&apos;API NVIDIA, priorités et statuts</p>
          </div>
          <IconArrowUpRight width={16} height={16} className="text-ink-3" />
        </Link>
      </div>
    </div>
  );
}
