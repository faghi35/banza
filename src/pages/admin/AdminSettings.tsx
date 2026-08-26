import { useCallback, useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { IconKey, IconShield, IconSettings } from "@/components/icons";
import { orchestrationApi, type OrchestrationSettings as Settings } from "@/lib/api";

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    orchestrationApi
      .get()
      .then(({ settings: s }) => setSettings(s))
      .catch(() => setSettings(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(change: Partial<Settings>) {
    if (!settings) return;
    setSaving(true);
    setNotice(null);
    // Mise à jour optimiste
    setSettings({ ...settings, ...change });
    try {
      const { settings: updated } = await orchestrationApi.updateSettings(change);
      setSettings(updated);
      setNotice("Paramètres enregistrés.");
    } catch {
      setNotice("Échec de l'enregistrement.");
      load();
    } finally {
      setSaving(false);
      window.setTimeout(() => setNotice(null), 2500);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Configuration</h1>
      <p className="mt-1 text-[15px] text-ink-2">
        Paramètres globaux de la plateforme. Les valeurs sensibles sont protégées côté backend.
      </p>

      {/* Orchestration IA */}
      <div className="mt-5 card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <IconSettings width={18} height={18} />
            Orchestration IA (Web Search)
          </h2>
          {notice && <span className="badge-accent animate-fade-in">{notice}</span>}
        </div>

        {!settings ? (
          <p className="mt-3 text-[13px] text-ink-3">Paramètres indisponibles.</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Toggle
                label="Web Search"
                desc="Recherche d'informations récentes"
                value={settings.search_enabled}
                disabled={saving}
                onChange={(v) => patch({ search_enabled: v })}
              />
              <Toggle
                label="Automatic Search"
                desc="Détection automatique des questions actuelles"
                value={settings.automatic}
                disabled={saving}
                onChange={(v) => patch({ automatic: v })}
              />
              <Toggle
                label="Citations"
                desc="Afficher les sources cliquables"
                value={settings.citations}
                disabled={saving}
                onChange={(v) => patch({ citations: v })}
              />
              <Toggle
                label="Source Validation"
                desc="Valider la réponse face aux sources"
                value={settings.validation}
                disabled={saving}
                onChange={(v) => patch({ validation: v })}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                label="Max Search Results"
                value={settings.max_results}
                min={1}
                max={10}
                disabled={saving}
                onCommit={(v) => patch({ max_results: v })}
              />
              <NumberField
                label="Max Validation Retries"
                value={settings.max_retries}
                min={0}
                max={2}
                disabled={saving}
                onCommit={(v) => patch({ max_retries: v })}
              />
            </div>

            <p className="mt-3 text-xs text-ink-3">
              Provider :{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 font-mono">{settings.provider}</code>{" "}
              — modifiable via la variable d&apos;environnement{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 font-mono">WEB_SEARCH_PROVIDER</code>.
              Les clés API restent exclusivement côté serveur.
            </p>
          </>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section
          icon={<IconSettings width={18} height={18} />}
          title="Général"
          rows={[
            ["Nom de la plateforme", "Banza AI"],
            ["Langue de l'interface", "Français (fr)"],
            ["URL de l'API", "Renseignée côté backend"],
          ]}
        />
        <Section
          icon={<BrandLogo height={20} />}
          title="Marque & apparence"
          rows={[
            ["Thème", <span key="theme" className="flex items-center gap-1.5 whitespace-nowrap"><ThemeToggle /><span>Clair / sombre</span></span>],
            ["Version", "V1"],
          ]}
        />
        <Section
          icon={<IconKey width={18} height={18} />}
          title="Modèles & API"
          rows={[
            ["Fournisseur", "NVIDIA LLM"],
            ["Clés de stockées", "Côté backend (ne sont jamais affichées)"],
          ]}
          note="La liste des modèles et les secrets restent gérés par le backend PHP : rien n'est codé en dur dans l'interface."
        />
        <Section
          icon={<IconShield width={18} height={18} />}
          title="Sécurité"
          rows={[
            ["Authentification", "Session PHP activée"],
            ["Accès administration", "Rôles (RBAC) vérifiés"],
          ]}
        />
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  rows,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  rows: [string, React.ReactNode][];
  note?: string;
}) {
  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        {icon}
        {title}
      </h2>
      <dl className="mt-3 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <dt className="text-[13px] text-ink-2">{k}</dt>
            <dd className="text-[13px] font-medium text-ink max-w-[55%] truncate">{v}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-3 text-xs text-ink-3">{note}</p>}
    </div>
  );
}

function Toggle({
  label,
  desc,
  value,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        <p className="truncate text-[11.5px] text-ink-3">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 ${
          value ? "bg-accent" : "bg-surface-3"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  disabled,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);

  function commit() {
    const n = parseInt(local, 10);
    if (Number.isNaN(n)) {
      setLocal(String(value));
      return;
    }
    onCommit(Math.max(min, Math.min(max, n)));
  }

  return (
    <label className="block rounded-xl border border-line bg-surface px-4 py-3">
      <span className="block text-[13px] font-semibold text-ink">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={local}
        disabled={disabled}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        className="input mt-2 w-24 py-1.5"
      />
    </label>
  );
}
