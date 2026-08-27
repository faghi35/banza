import { useState, useEffect, useCallback } from "react";
import {
  IconActivity,
  IconCheck,
  IconCpu,
  IconGlobe,
  IconRefresh,
  IconShield,
  IconSparkles,
} from "@/components/icons";
import { API_URL, authApi, conversationsApi, streamChat, adminApi } from "@/lib/api";

interface TestResult {
  id: string;
  name: string;
  category: "api" | "db" | "llm" | "cors";
  status: "idle" | "running" | "success" | "warning" | "error";
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown> | string;
}

export default function AdminDiagnostics() {
  const [tests, setTests] = useState<Record<string, TestResult>>({
    api_ping: {
      id: "api_ping",
      name: "Connectivité API Backend",
      category: "api",
      status: "idle",
    },
    cors_check: {
      id: "cors_check",
      name: "En-têtes CORS & Credentials",
      category: "cors",
      status: "idle",
    },
    db_check: {
      id: "db_check",
      name: "Base de données MySQL & Sessions",
      category: "db",
      status: "idle",
    },
    llm_test: {
      id: "llm_test",
      name: "Génération LLM (NVIDIA / Llama)",
      category: "llm",
      status: "idle",
    },
  });

  const [isRunningAll, setIsRunningAll] = useState(false);
  const [llmOutput, setLlmOutput] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("Réponds en 1 phrase courte : Es-tu prêt ?");

  const updateTest = useCallback((id: string, partial: Partial<TestResult>) => {
    setTests((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...partial },
    }));
  }, []);

  // 1. Test API Ping
  const runApiPing = useCallback(async () => {
    updateTest("api_ping", { status: "running", message: "Envoi de la requête..." });
    const start = performance.now();
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        updateTest("api_ping", {
          status: "success",
          latencyMs: latency,
          message: `API en ligne (${res.status} OK)`,
          details: {
            endpoint: `${API_URL}/api/auth/me`,
            status: res.status,
            latency: `${latency}ms`,
            user: data.user?.email ?? "Session invité active",
          },
        });
      } else {
        updateTest("api_ping", {
          status: "error",
          latencyMs: latency,
          message: `Erreur HTTP ${res.status}`,
          details: `Le serveur a répondu avec le statut ${res.status}`,
        });
      }
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      updateTest("api_ping", {
        status: "error",
        latencyMs: latency,
        message: "Connexion refusée ou serveur injoignable",
        details: String(err),
      });
    }
  }, [updateTest]);

  // 2. Test CORS
  const runCorsCheck = useCallback(async () => {
    updateTest("cors_check", { status: "running", message: "Vérification des en-têtes..." });
    try {
      const origin = window.location.origin;
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        updateTest("cors_check", {
          status: "success",
          message: `Origine ${origin} acceptée`,
          details: {
            clientOrigin: origin,
            apiUrl: API_URL,
            credentialsPassed: true,
          },
        });
      } else if (res.status === 0 || !res.ok) {
        updateTest("cors_check", {
          status: "warning",
          message: "Possible restriction CORS ou problème d'en-têtes",
          details: `Statut HTTP ${res.status}`,
        });
      }
    } catch (err) {
      updateTest("cors_check", {
        status: "error",
        message: "Requête CORS bloquée par le navigateur",
        details: String(err),
      });
    }
  }, [updateTest]);

  // 3. Test Base de données MySQL
  const runDbCheck = useCallback(async () => {
    updateTest("db_check", { status: "running", message: "Interrogation de la base de données..." });
    const start = performance.now();
    try {
      const res = await adminApi.stats();
      const latency = Math.round(performance.now() - start);
      if (res.stats) {
        updateTest("db_check", {
          status: "success",
          latencyMs: latency,
          message: `Base MySQL connectée (${res.stats.users} utilisateurs, ${res.stats.conversations} conversations)`,
          details: {
            usersTotal: res.stats.users,
            adminsCount: res.stats.admins,
            messagesTotal: res.stats.messages,
            conversationsTotal: res.stats.conversations,
            latency: `${latency}ms`,
          },
        });
      }
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      updateTest("db_check", {
        status: "error",
        latencyMs: latency,
        message: "Échec de lecture MySQL",
        details: String(err),
      });
    }
  }, [updateTest]);

  // 4. Test LLM Streaming
  const runLlmTest = useCallback(async () => {
    updateTest("llm_test", { status: "running", message: "Envoi du prompt au modèle IA..." });
    setLlmOutput("");
    const start = performance.now();
    let tokensCount = 0;
    let ttft = 0;

    try {
      await streamChat(
        customPrompt || "Ping",
        null,
        {
          onDelta: (delta) => {
            if (tokensCount === 0) {
              ttft = Math.round(performance.now() - start);
            }
            tokensCount++;
            setLlmOutput((prev) => prev + delta);
          },
          onError: (errMsg) => {
            updateTest("llm_test", {
              status: "error",
              message: `Refus du modèle : ${errMsg}`,
              details: errMsg,
            });
          },
          onDone: () => {
            const totalMs = Math.round(performance.now() - start);
            updateTest("llm_test", {
              status: "success",
              latencyMs: totalMs,
              message: `Réponse reçue (TTFT: ${ttft || totalMs}ms, ${tokensCount} deltas)`,
              details: {
                ttft: `${ttft || totalMs}ms`,
                totalTime: `${totalMs}ms`,
                deltasCount: tokensCount,
              },
            });
          },
        }
      );
    } catch (err) {
      updateTest("llm_test", {
        status: "error",
        message: "Échec de l'appel au modèle LLM",
        details: String(err),
      });
    }
  }, [customPrompt, updateTest]);

  // Lancer tous les tests
  const runAll = useCallback(async () => {
    setIsRunningAll(true);
    await runApiPing();
    await runCorsCheck();
    await runDbCheck();
    await runLlmTest();
    setIsRunningAll(false);
  }, [runApiPing, runCorsCheck, runDbCheck, runLlmTest]);

  useEffect(() => {
    runAll();
  }, [runAll]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <IconActivity width={24} height={24} className="text-accent" />
            Centre de Diagnostic & Test de Connexion
          </h1>
          <p className="mt-1 text-[14.5px] text-ink-2">
            Vérifiez en temps réel l&apos;état de santé de l&apos;API backend, de MySQL, des en-têtes CORS et du modèle LLM.
          </p>
        </div>

        <button
          type="button"
          onClick={runAll}
          disabled={isRunningAll}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 shadow-sm self-start sm:self-auto text-xs font-bold disabled:opacity-50"
        >
          <IconRefresh width={14} height={14} className={isRunningAll ? "animate-spin" : ""} />
          <span>{isRunningAll ? "Diagnostic en cours…" : "Relancer tous les tests"}</span>
        </button>
      </div>

      {/* Cartes d'environnement actif */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-3">Cible API Active</p>
          <p className="mt-1 text-sm font-semibold text-accent truncate" title={API_URL}>
            {API_URL}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-3">
            {API_URL.includes("localhost") ? "Mode Développement Local" : "Mode Serveur Distant / Prod"}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-3">Origine Client Web</p>
          <p className="mt-1 text-sm font-semibold text-ink truncate" title={window.location.origin}>
            {window.location.origin}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-3">Domaine appelant pour les requêtes CORS</p>
        </div>

        <div className="card p-4">
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-3">Mode d&apos;authentification</p>
          <p className="mt-1 text-sm font-semibold text-ink">Cookies HttpOnly + Guest Token</p>
          <p className="mt-0.5 text-[11px] text-ink-3">Credentials : &quot;include&quot;</p>
        </div>
      </div>

      {/* Grille des résultats des tests */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Test 1 : API Ping */}
        <DiagnosticCard
          test={tests.api_ping}
          onRun={runApiPing}
          icon={<IconGlobe width={18} height={18} />}
        />

        {/* Test 2 : CORS */}
        <DiagnosticCard
          test={tests.cors_check}
          onRun={runCorsCheck}
          icon={<IconShield width={18} height={18} />}
        />

        {/* Test 3 : Base de données */}
        <DiagnosticCard
          test={tests.db_check}
          onRun={runDbCheck}
          icon={<IconActivity width={18} height={18} />}
        />

        {/* Test 4 : LLM Streaming */}
        <DiagnosticCard
          test={tests.llm_test}
          onRun={runLlmTest}
          icon={<IconCpu width={18} height={18} />}
        />
      </div>

      {/* Console de test interactif LLM */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconSparkles width={18} height={18} className="text-accent" />
            <h2 className="text-sm font-bold text-ink">Test Interactif de Génération LLM en Direct</h2>
          </div>
          <button
            type="button"
            onClick={runLlmTest}
            disabled={tests.llm_test.status === "running"}
            className="btn-subtle px-3 py-1.5 text-xs font-semibold"
          >
            Tester ce prompt
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Écrivez un prompt de test…"
            className="input flex-1 text-[13.5px]"
          />
        </div>

        <div className="rounded-xl border border-line bg-surface-2/60 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">Flux SSE Reçu :</p>
          <div className="mt-2 min-h-[4rem] text-sm text-ink leading-relaxed font-mono whitespace-pre-wrap">
            {llmOutput ? (
              llmOutput
            ) : tests.llm_test.status === "running" ? (
              <span className="text-accent animate-pulse">En attente des tokens du modèle LLM…</span>
            ) : (
              <span className="text-ink-3 italic">Aucune sortie générée pour l&apos;instant. Cliquez sur &quot;Tester ce prompt&quot;.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnosticCard({
  test,
  onRun,
  icon,
}: {
  test: TestResult;
  onRun: () => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-line bg-surface-2 p-2 text-ink">
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">{test.name}</h3>
              {test.latencyMs !== undefined && (
                <span className="text-[11px] font-semibold tabular-nums text-accent">
                  Temps de réponse : {test.latencyMs} ms
                </span>
              )}
            </div>
          </div>

          <StatusBadge status={test.status} />
        </div>

        {test.message && (
          <p className="mt-3 text-[13px] text-ink-2 font-medium">
            {test.message}
          </p>
        )}

        {test.details && (
          <div className="mt-3 rounded-lg border border-line/60 bg-surface-2/40 p-2.5 text-[11.5px] font-mono text-ink-2 break-all overflow-x-auto">
            {typeof test.details === "object" ? (
              <pre>{JSON.stringify(test.details, null, 2)}</pre>
            ) : (
              String(test.details)
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-line/50 flex justify-end">
        <button
          type="button"
          onClick={onRun}
          disabled={test.status === "running"}
          className="btn-ghost py-1 px-3 text-xs font-semibold"
        >
          {test.status === "running" ? "Test en cours…" : "Tester à nouveau"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TestResult["status"] }) {
  switch (status) {
    case "running":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent animate-pulse">
          En cours…
        </span>
      );
    case "success":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
          <IconCheck width={12} height={12} />
          Opérationnel
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning">
          Avertissement
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-0.5 text-xs font-bold text-danger">
          Échec
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-3">
          Non testé
        </span>
      );
  }
}
