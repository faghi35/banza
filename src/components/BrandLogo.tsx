// ============================================================
// Branding Banza AI — Logos officiels du dossier /public
// Palette stricte : Bleu foncé, Noir, Blanc
// ============================================================

interface BrandProps {
  className?: string;
}

/**
 * Logo icône / Avatar officiel (carré ou circulaire)
 * Utilise /logo-banza-ai.png (haute résolution) ou /logo-banza-blue.png
 */
export function BrandMark({
  className = "",
  width = 34,
  height = 34,
  variant = "default",
}: BrandProps & { width?: number; height?: number; variant?: "default" | "blue" }) {
  const src = variant === "blue" ? "/logo-banza-blue.png" : "/logo-banza-ai.png";

  return (
    <img
      src={src}
      alt="Banza AI"
      width={width}
      height={height}
      className={`shrink-0 rounded-xl object-contain shadow-sm transition-transform duration-300 hover:scale-105 ${className}`}
      loading="eager"
    />
  );
}

/**
 * Logotype horizontal complet officiel
 * Utilise /banza-ai.png avec harmonisation pour les modes clair / sombre
 */
export function BrandLogo({
  className = "",
  height = 28,
  showText = false,
}: BrandProps & { height?: number; showText?: boolean }) {
  return (
    <span
      className={`group inline-flex select-none items-center gap-2.5 transition-transform duration-300 hover:scale-[1.02] ${className}`}
      style={{ height }}
    >
      <img
        src="/logo-dark.png"
        alt="Banza AI"
        title="Banza AI"
        className="h-full w-auto max-w-[190px] object-contain dark:hidden"
        loading="eager"
      />
      <img
        src="/logo-light.png"
        alt="Banza AI"
        title="Banza AI"
        className="hidden h-full w-auto max-w-[190px] object-contain brightness-110 contrast-125 dark:block"
        loading="eager"
      />
      {showText && (
        <span className="font-brand tracking-wide text-ink">
          BANZA <span className="text-accent">AI</span>
        </span>
      )}
    </span>
  );
}

/**
 * Pastille circulaire d'avatar utilisateur (monochrome avec accent bleu foncé)
 */
export function UserAvatar({ name, className = "" }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-accent text-white font-brand text-xs shadow-sm ${className}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}