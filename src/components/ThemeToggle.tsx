"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "./icons";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    setTheme(dark ? "dark" : "light");
    setReady(true);
  }, []);

  function toggle() {
    const next: "light" | "dark" = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem("banza-theme", next);
    } catch {
      // stockage
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
      title={theme === "dark" ? "Passer en mode clair (Blanc & Bleu foncé)" : "Passer en mode sombre (Noir & Bleu foncé)"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink-2 shadow-sm transition hover:border-accent hover:text-accent hover:bg-accent-soft active:scale-95 ${
        ready ? "" : "opacity-0"
      } ${className}`}
    >
      {theme === "dark" ? <IconMoon width={16} height={16} /> : <IconSun width={16} height={16} />}
    </button>
  );
}