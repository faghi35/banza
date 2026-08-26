import { useCallback, useEffect, useState } from "react";
import { IconAlert, IconCheck, IconCpu, IconPlus, IconX } from "@/components/icons";
import { llmModelsApi, type LlmModelRow } from "@/lib/api";

const EMPTY_FORM = {
  name: "",
  provider: "nvidia",
  model_name: "",
  api_endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
  api_key: "",
  status: "active" as "active" | "inactive" | "degraded",
  priority: 1,
  max_tokens: 4096,
  temperature: 0.7,
};

export default function AdminModels() {
  const [rows, setRows] = useState<LlmModelRow[] | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LlmModelRow | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    llmModelsApi.list().then(({ models }) => setRows(models)).catch(() => setRows([]));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeModelId = rows
    ?.filter((m) => m.status === "active" && m.has_key)
    .sort((a, b) => a.priority - b.priority)[0]?.id ?? null;

  const noKey = rows !== null && !rows.some((m) => m.status === "active" && m.has_key);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  }

  function openEdit(m: LlmModelRow) {
    setEditing(m);
    setForm({
      name: m.name,
      provider: m.provider,
      model_name: m.model_name,
      api_endpoint: m.api_endpoint ?? EMPTY_FORM.api_endpoint,
      api_key: "",
      status: m.status,
      priority: m.priority,
      max_tokens: m.max_tokens,
      temperature: m.temperature,
    });
    setFormOpen(true);
  }

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.name.trim() || !form.model_name.trim()) {
      setNotice({ kind: "err", text: "Le nom et l'identifiant du modèle sont requis." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const payload: Record<string, string | number> = {
        name: form.name.trim(),
        provider: form.provider.trim() || "nvidia",
        model_name: form.model_name.trim(),
        api_endpoint: form.api_endpoint.trim(),
        status: form.status,
        priority: form.priority,
        max_tokens: form.max_tokens,
        temperature: form.temperature,
      };
      if (form.api_key.trim()) payload.api_key = form.api_key.trim();
      if (editing) {
        await llmModelsApi.update(editing.id, payload);
        setNotice({ kind: "ok", text: "Modèle mis à jour." });
      } else {
        await llmModelsApi.create(payload);
        setNotice({ kind: "ok", text: "Modèle ajouté." });
      }
      setFormOpen(false);
      refresh();
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Échec de l'enregistrement." });
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(m: LlmModelRow) {
    setNotice(null);
    try {
      await llmModelsApi.update(m.id, { status: m.status === "active" ? "inactive" : "active" });
      refresh();
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Action impossible." });
    }
  }

  async function remove(m: LlmModelRow) {
    if (!confirm(`Supprimer le modèle « ${m.name} » ?`)) return;
    try {
      await llmModelsApi.remove(m.id);
      refresh();
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Suppression impossible." });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Modèles IA</h1>
          <p className="mt-1 text-[15px] text-ink-2">
            Catalogue des LLM disponibles — le modèle actif est sélectionné automatiquement par priorité.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary gap-2 py-2.5">
          <IconPlus width={16} height={16} />
          Ajouter un modèle
        </button>
      </div>

      {notice && (
        <p
          role="alert"
          className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
            notice.kind === "ok" ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {notice.text}
        </p>
      )}

      {noKey && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
          <IconAlert width={16} height={16} className="mt-0.5 shrink-0 text-warning" />
          <p className="text-[13px] leading-relaxed text-ink-2">
            <strong className="font-semibold text-ink">Aucun modèle actif avec clé API.</strong>{" "}
            Cliquez sur « Modifier », collez la clé <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[12px]">nvapi-…</code>{" "}
            et enregistrez pour activer le chat IA.
          </p>
        </div>
      )}

      {formOpen && (
        <div className="mt-5 card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">
              {editing ? `Modifier « ${editing.name} »` : "Nouveau modèle"}
            </h2>
            <button type="button" onClick={() => setFormOpen(false)} className="icon-btn text-ink-3 hover:bg-surface-2" aria-label="Fermer">
              <IconX width={18} height={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Nom affiché *">
              <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="llama-3.1-8b-instruct" />
            </Field>
            <Field label="Fournisseur">
              <input className="input" value={form.provider} onChange={(e) => set("provider", e.target.value)} placeholder="nvidia" />
            </Field>
            <Field label="Identifiant du modèle (model_name) *">
              <input className="input" value={form.model_name} onChange={(e) => set("model_name", e.target.value)} placeholder="meta/llama-3.1-8b-instruct" />
            </Field>
            <Field label="Endpoint API">
              <input className="input" value={form.api_endpoint} onChange={(e) => set("api_endpoint", e.target.value)} />
            </Field>
            <Field label={editing && editing.has_key ? "Nouvelle clé API (vide = conserver)" : "Clé API"}>
              <input
                type="password"
                className="input"
                value={form.api_key}
                onChange={(e) => set("api_key", e.target.value)}
                placeholder={editing && editing.has_key ? `Déjà renseignée : ${editing.api_key_masked ?? "•••"}` : "nvapi-…"}
                autoComplete="off"
              />
            </Field>
            <Field label="Statut">
              <select className="input" value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="degraded">Dégradé</option>
              </select>
            </Field>
            <Field label="Priorité (1 = plus haute)">
              <input type="number" min={1} className="input" value={form.priority} onChange={(e) => set("priority", Number(e.target.value) || 1)} />
            </Field>
            <Field label="Max tokens">
              <input type="number" min={256} className="input" value={form.max_tokens} onChange={(e) => set("max_tokens", Number(e.target.value) || 4096)} />
            </Field>
            <Field label="Température (0–1)">
              <input type="number" step={0.1} min={0} max={1} className="input" value={form.temperature} onChange={(e) => set("temperature", Number(e.target.value))} />
            </Field>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-subtle px-4 py-2">Annuler</button>
            <button type="button" onClick={save} disabled={saving} className="btn-primary px-5 py-2">
              {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </div>
      )}

      {/* Tableau des modèles */}
      <div className="mt-5 card overflow-x-auto">
        {!rows ? (
          <p className="px-6 py-10 text-center text-sm text-ink-3">Chargement du catalogue…</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <IconCpu width={24} height={24} className="text-ink-3" />
            <p className="mt-3 text-sm font-medium text-ink">Catalogue vide</p>
            <p className="mt-1 text-[13px] text-ink-3">Ajoutez votre premier modèle avec le bouton ci-dessus.</p>
          </div>
        ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left">
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Nom</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Provider</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Modèle</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Statut</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Priorité</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Max tokens</th>
                <th className="px-4 py-2.5 text-[12px] font-semibold text-ink-2">Clé API</th>
                <th className="px-4 py-2.5 text-right text-[12px] font-semibold text-ink-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0 hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {activeModelId === m.id && (
                        <span className="badge-success shrink-0" title="Modèle actuellement utilisé par le chat">
                          <IconCheck width={11} height={11} />
                        </span>
                      )}
                      <span className="font-medium text-ink">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{m.provider}</td>
                  <td className="px-4 py-3 font-mono text-[12.5px] text-ink-2">{m.model_name}</td>
                  <td className="px-4 py-3">
                    <span className={m.status === "active" ? "badge-success" : m.status === "degraded" ? "border-warning/30 bg-warning/10 text-warning" : "badge"}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-2">{m.priority}</td>
                  <td className="px-4 py-3 tabular-nums text-ink-2">{m.max_tokens}</td>
                  <td className="px-4 py-3">
                    {m.has_key ? (
                      <span className="badge" title={m.api_key_masked ?? undefined}>
                        {m.api_key_masked}
                      </span>
                    ) : (
                      <span className="badge-danger">aucune</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <RowBtn onClick={() => openEdit(m)}>Modifier</RowBtn>
                      <RowBtn onClick={() => toggleStatus(m)}>
                        {m.status === "active" ? "Désactiver" : "Activer"}
                      </RowBtn>
                      <RowBtn tone onClick={() => remove(m)}>Supprimer</RowBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-3">
        Le chat utilise le modèle avec le statut « actif », une clé renseignée et la plus petite priorité.
        Les clés API sont stockées uniquement côté serveur et jamais affichées en clair.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}

function RowBtn({ children, onClick, tone }: { children: React.ReactNode; onClick: () => void; tone?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition ${
        tone ? "text-danger hover:bg-danger/10" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
