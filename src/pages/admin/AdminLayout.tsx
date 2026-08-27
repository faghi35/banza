import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import {
  IconActivity,
  IconChat,
  IconCpu,
  IconDashboard,
  IconLogout,
  IconLogs,
  IconMenu,
  IconSettings,
  IconUsers,
  IconX,
} from "@/components/icons";
import { authApi } from "@/lib/api";

type Stage = "checking" | "admin" | "guest" | "denied";

const NAV = [
  { to: "/admin", label: "Tableau de bord", icon: IconDashboard, end: true },
  { to: "/admin/diagnostics", label: "Test Connexion", icon: IconActivity },
  { to: "/admin/users", label: "Utilisateurs", icon: IconUsers },
  { to: "/admin/conversations", label: "Conversations", icon: IconChat },
  { to: "/admin/models", label: "Modèles IA", icon: IconCpu },
  { to: "/admin/settings", label: "Configuration", icon: IconSettings },
  { to: "/admin/logs", label: "Journal / Logs", icon: IconLogs },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [stage, setStage] = useState<Stage>("checking");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then(({ user }) => {
        if (!user) setStage("guest");
        else if (user.role === "admin" || user.is_admin) setStage("admin");
        else setStage("denied");
      })
      .catch(() => setStage("guest"));
  }, []);

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  if (stage === "checking") {
    return (
      <main className="flex h-dvh items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-accent/25 border-t-accent" />
      </main>
    );
  }

  if (stage === "guest") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas px-5">
        <div className="card-glass max-w-sm w-full p-8 text-center shadow-popover">
          <h1 className="text-xl font-extrabold text-ink">Accès restreint</h1>
          <p className="mt-2 text-sm text-ink-2">
            L&apos;administration de Banza AI est réservée aux administrateurs autorisés.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link to="/login" className="btn-primary w-full justify-center py-2.5">Se connecter</Link>
            <Link to="/" className="btn-ghost w-full justify-center py-2.5">Retour au chat</Link>
          </div>
        </div>
      </main>
    );
  }

  if (stage === "denied") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas px-5">
        <div className="card-glass max-w-sm w-full p-8 text-center shadow-popover">
          <h1 className="text-xl font-extrabold text-ink">Accès refusé</h1>
          <p className="mt-2 text-sm text-ink-2">
            Votre compte ne dispose pas des droits administrateur nécessaires.
          </p>
          <div className="mt-6">
            <Link to="/" className="btn-primary w-full justify-center py-2.5">
              Retour à l&apos;application
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const navLinks = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV.map((n) => {
        const Icon = n.icon;
        const active = n.end ? pathname === n.to : pathname.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setMobileMenuOpen(false)}
            className={`nav-item ${active ? "active" : ""}`}
          >
            <Icon width={16} height={16} className={`shrink-0 ${active ? "text-accent" : "text-ink-3"}`} />
            <span className="text-[13.5px]">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      {/* Barre supérieure Admin */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/70 bg-surface/85 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl p-2 text-ink-2 hover:bg-surface-2 md:hidden"
            aria-label="Ouvrir le menu"
          >
            <IconMenu width={20} height={20} />
          </button>
          <Link to="/" className="flex items-center gap-2" aria-label="Banza AI — accueil">
            <BrandLogo height={26} />
            <span className="rounded-md border border-accent/30 bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-accent">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/" className="btn-subtle py-1.5 px-3 text-xs font-semibold">
            Ouvrir le Chat
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="rounded-xl p-2 text-ink-3 hover:bg-surface-2 hover:text-danger transition"
            title="Se déconnecter"
          >
            <IconLogout width={18} height={18} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Navigation Desktop */}
        <aside className="hidden w-64 shrink-0 border-r border-line bg-surface/80 backdrop-blur-xl md:flex md:flex-col">
          {navLinks}
          <div className="border-t border-line/60 p-4 text-[11px] text-ink-3">
            Banza AI Core v2.0
          </div>
        </aside>

        {/* Navigation Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
              aria-hidden="true"
            />
            <aside className="relative flex w-4/5 max-w-xs flex-col bg-surface shadow-2xl animate-slide-in-right">
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <BrandLogo height={24} />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl p-1.5 text-ink-3 hover:bg-surface-2"
                >
                  <IconX width={18} height={18} />
                </button>
              </div>
              {navLinks}
            </aside>
          </div>
        )}

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
