import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { authApi, ApiError } from "@/lib/api";
import { getGuestToken } from "@/lib/auth-gate";
import { normalizeApiError, devLog } from "@/lib/errors";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const guestToken = getGuestToken() ?? undefined;
      const res = await authApi.login(email, password, guestToken);
      if (res.user.migrated?.migrated_conversations) {
        setSuccessNotice(
          `Connexion réussie ! Vos conversations invitées (${res.user.migrated.migrated_conversations}) ont été fusionnées.`
        );
      }
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
    } catch (err) {
      devLog("login", err);
      setError(normalizeApiError(err).userMessage);
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-canvas px-4 py-8 overflow-hidden">
      {/* Halo bleu nuit d'arrière-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.18),transparent_65%)] animate-pulse-glow"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-between px-1">
          <Link to="/" className="flex items-center" aria-label="Banza AI — accueil">
            <BrandLogo height={30} />
          </Link>
          <ThemeToggle />
        </div>

        <div className="card-glass p-8 sm:p-9 shadow-popover">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Connexion</h1>
          <p className="mt-1.5 text-sm text-ink-2">
            Ravi de vous revoir. Connectez-vous à votre espace Banza AI.
          </p>

          {successNotice && (
            <div className="mt-4 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm font-semibold text-success">
              {successNotice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-ink-2">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="vous@exemple.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-ink-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-danger/10 border border-danger/30 px-3.5 py-2.5 text-sm font-medium text-danger">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[14.5px] mt-2">
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 border-t border-line/60 pt-5 text-center">
            <p className="text-sm text-ink-2">
              Pas encore de compte ?{" "}
              <Link to="/register" className="font-semibold text-accent hover:underline">
                Créer un compte gratuit
              </Link>
            </p>
            <Link
              to="/"
              className="mt-3 inline-block text-xs font-medium text-ink-3 hover:text-ink transition"
            >
              ← Continuer en mode invité sans compte
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
