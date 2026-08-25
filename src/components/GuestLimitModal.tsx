"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BrandLogo } from "./BrandLogo";
import {
  IconArrowRight,
  IconCheck,
  IconLock,
  IconSparkles,
  IconX,
} from "./icons";
import type { UsageInfo } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  benefits?: string[];
  usage?: UsageInfo | null;
  featureGate?: boolean;
}

export default function GuestLimitModal({
  open,
  onClose,
  title,
  description,
  benefits,
  usage,
  featureGate = false,
}: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const modalTitle = title ?? "Continuez avec Banza AI";
  const modalDesc =
    description ??
    "Vous avez atteint votre limite d'utilisation gratuite en mode invité (10 messages par jour). Créez gratuitement votre compte pour continuer vos conversations sans interruption.";

  const defaultBenefits = [
    "Historique permanent & reprise illimitée",
    "Conversations sauvegardées en ligne",
    "Synchronisation multi-écrans (Mobile & PC)",
    "50 messages gratuits chaque jour",
    "Recherche web temps réel & IA de pointe",
  ];

  const displayBenefits = benefits && benefits.length > 0 ? benefits : defaultBenefits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Fond sombre transparent */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/50 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Boîte Modale — Plein écran fluide sur mobile, carte élégante sur desktop */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex h-full w-full flex-col justify-between overflow-y-auto bg-surface p-6 shadow-2xl transition-all sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-3xl sm:border sm:border-line sm:p-8 animate-scale-in"
      >
        {/* Lueur d'ambiance bleue */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.22),transparent_70%)] animate-pulse-glow"
        />

        {/* Bouton Fermer / Retour au chat */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-ink-3 hover:bg-surface-2 hover:text-ink transition"
          aria-label="Fermer et retourner au chat"
          title="Retour au chat"
        >
          <IconX width={20} height={20} />
        </button>

        {/* Corps principal */}
        <div className="relative">
          {/* Header avec Logo & Badge */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <BrandLogo height={32} />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-bold text-accent shadow-sm">
              {featureGate ? (
                <>
                  <IconLock width={13} height={13} />
                  <span>Compte gratuit requis</span>
                </>
              ) : (
                <>
                  <IconSparkles width={13} height={13} />
                  <span>Limite invité atteinte · {usage?.used ?? 10} / {usage?.limit ?? 10}</span>
                </>
              )}
            </div>

            <h2 className="mt-3.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {modalTitle}
            </h2>

            <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-2">
              {modalDesc}
            </p>
          </div>

          {/* Liste des bénéfices */}
          <div className="mt-6 rounded-2xl border border-line/70 bg-surface-2/60 p-4 sm:p-5">
            <p className="text-[12.5px] font-bold uppercase tracking-wider text-ink-2">
              Ce que vous débloquez gratuitement :
            </p>
            <ul className="mt-3 space-y-2.5">
              {displayBenefits.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-[13.5px] text-ink">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <IconCheck width={10} height={10} />
                  </span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="relative mt-7 flex flex-col gap-2.5 pt-2">
          <Link
            href="/register"
            onClick={onClose}
            className="btn-primary w-full justify-center gap-2 py-3.5 text-[15px] font-bold shadow-md shadow-accent/20"
          >
            <span>Créer mon compte gratuit</span>
            <IconArrowRight width={16} height={16} />
          </Link>

          <Link
            href="/login"
            onClick={onClose}
            className="btn-subtle w-full justify-center py-3 text-[14px] font-semibold"
          >
            Déjà un compte ? Se connecter
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="mt-1 text-center text-xs font-medium text-ink-3 hover:text-ink transition"
          >
            ← Retourner au chat
          </button>
        </div>
      </div>
    </div>
  );
}
