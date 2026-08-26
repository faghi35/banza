import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { IconChevronRight, IconShield, IconUser } from "@/components/icons";
import { authApi } from "@/lib/api";
import type { User } from "@/lib/types";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then(({ user: u }) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-dvh bg-canvas">
      <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between border-b border-line/60 pb-4">
          <Link to="/" className="flex items-center" aria-label="Banza AI — accueil">
            <BrandLogo height={28} />
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/" className="btn-subtle py-1.5 px-3.5 text-xs font-semibold">Chat</Link>
            <ThemeToggle />
          </nav>
        </header>

        <div className="mt-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Paramètres</h1>
          <p className="mt-1 text-sm text-ink-2">Gérez votre compte et vos préférences Banza AI.</p>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-accent/25 border-t-accent" />
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Compte */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-3 flex items-center gap-2 mb-2 px-1">
                <IconUser width={15} height={15} /> Compte utilisateur
              </h2>
              <div className="card p-6">
                {user ? (
                  <>
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white font-bold text-lg shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-bold text-ink text-base">{user.name}</p>
                        <p className="text-sm text-ink-3">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-line flex items-center justify-between text-xs text-ink-3">
                      <span>Rôle du profil</span>
                      <span className="font-semibold text-accent uppercase tracking-wider">{user.role || "Utilisateur"}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-start gap-3">
                    <p className="text-sm text-ink-2">
                      Vous naviguez actuellement en mode invité. Créez un compte pour synchroniser et sécuriser votre historique.
                    </p>
                    <Link to="/register" className="btn-primary py-2.5 px-4 text-xs">
                      Créer un compte gratuit
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Apparence */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-3 mb-2 px-1">
                Apparence
              </h2>
              <div className="card flex items-center justify-between p-5">
                <div>
                  <p className="font-bold text-ink text-sm">Thème d&apos;affichage</p>
                  <p className="text-xs text-ink-3">Basculez entre le mode clair et le mode sombre</p>
                </div>
                <ThemeToggle />
              </div>
            </section>

            {/* Sécurité */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-3 flex items-center gap-2 mb-2 px-1">
                <IconShield width={15} height={15} /> Sécurité &amp; Accès
              </h2>
              <div className="card p-4 space-y-1">
                <Row label="Mot de passe" desc={user ? "Modifier votre mot de passe" : "Disponible après connexion"} to={user ? "/settings" : "/login"} />
                <Row label="Sessions actives" desc={user ? "Connecté sur cet appareil" : "—"} to={user ? "/settings" : "/login"} last />
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, desc, to, last }: { label: string; desc: string; to: string; last?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition hover:bg-surface-2 ${last ? "" : "border-b border-line/40"}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="text-xs text-ink-3">{desc}</p>
      </div>
      <IconChevronRight width={16} height={16} className="text-ink-3 shrink-0" />
    </Link>
  );
}
