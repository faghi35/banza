"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  IconArrowRight,
  IconCheck,
  IconCpu,
  IconGlobe,
  IconLock,
  IconSparkles,
} from "./icons";

interface PWAInstallGateProps {
  onInstalledOrBypass: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallGate({ onInstalledOrBypass }: PWAInstallGateProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    // 1. Détection du mode Standalone (PWA déjà installée)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isStandaloneQuery = new URLSearchParams(window.location.search).get("mode") === "standalone";
      
      if (isStandaloneMedia || isIOSStandalone || isStandaloneQuery) {
        setIsStandalone(true);
        onInstalledOrBypass();
      }
    };

    checkStandalone();

    // 2. Détection de l'appareil iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // 3. Capture de l'événement natif d'installation
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. Écoute de l'événement d'installation terminée
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        onInstalledOrBypass();
      }, 1200);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [onInstalledOrBypass]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setInstalledSuccess(true);
          setTimeout(() => {
            onInstalledOrBypass();
          }, 1000);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowManualGuide(true);
    } else {
      setShowManualGuide(true);
    }
  };

  if (isStandalone) {
    return null;
  }

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-[#080D1A] text-slate-100 px-4 py-8 overflow-hidden select-none">
      {/* Halos de lumière ambiants */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent_70%)] animate-pulse-glow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.16),transparent_70%)] animate-pulse-glow"
      />

      <div className="relative w-full max-w-lg z-10 flex flex-col items-center">
        {/* Logo PWA avec fond bleu foncé */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-60 blur-lg transition duration-500 group-hover:opacity-100 group-hover:blur-xl" />
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-[#080D1A] border-2 border-blue-500/40 p-2.5 shadow-2xl flex items-center justify-center">
            <Image
              src="/icons/icon-192x192.png"
              alt="Banza AI Icon"
              width={100}
              height={100}
              priority
              className="rounded-2xl object-cover"
            />
          </div>
        </div>

        {/* Titre & Description */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <IconSparkles width={14} height={14} />
            <span>Application Progressive Web (PWA)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Installez <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Banza AI</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
            Pour profiter de l&apos;expérience optimale, des réponses instantanées et du mode vocal, Banza AI doit être installé sur votre appareil.
          </p>
        </div>

        {/* Carte des fonctionnalités / Avantages PWA */}
        <div className="w-full grid grid-cols-2 gap-3 mb-8">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center gap-2.5 mb-1 text-sky-400 font-semibold text-xs sm:text-sm">
              <IconCpu width={16} height={16} />
              <span>Réactivité Native</span>
            </div>
            <p className="text-[11.5px] text-slate-400">
              Lancement direct en 1 clic sans passer par l&apos;URL du navigateur.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center gap-2.5 mb-1 text-indigo-400 font-semibold text-xs sm:text-sm">
              <IconGlobe width={16} height={16} />
              <span>Plein Écran Dédié</span>
            </div>
            <p className="text-[11.5px] text-slate-400">
              Interface immersive épurée, sans barre d&apos;onglets encombrante.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center gap-2.5 mb-1 text-emerald-400 font-semibold text-xs sm:text-sm">
              <IconCheck width={16} height={16} />
              <span>Session Persistante</span>
            </div>
            <p className="text-[11.5px] text-slate-400">
              Vos échanges et votre compte restent synchronisés en continu.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center gap-2.5 mb-1 text-purple-400 font-semibold text-xs sm:text-sm">
              <IconLock width={16} height={16} />
              <span>Sécurité & Vitesse</span>
            </div>
            <p className="text-[11.5px] text-slate-400">
              Chiffrement TLS et streaming temps réel avec Llama 3.1 70B.
            </p>
          </div>
        </div>

        {/* Bouton d'action principal d'installation */}
        <div className="w-full space-y-3">
          {installedSuccess ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-center flex items-center justify-center gap-2 animate-bounce">
              <IconCheck width={20} height={20} />
              <span>Installation réussie ! Ouverture en cours…</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={installing}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-blue-500/25 border border-blue-400/30 transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {installing ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Installation en cours…</span>
                </>
              ) : (
                <>
                  <IconSparkles width={18} height={18} />
                  <span>Installer l&apos;application Banza AI</span>
                </>
              )}
            </button>
          )}

          {/* Guide manuel accordéon pour iOS Safari ou navigateurs sans prompt */}
          {showManualGuide && (
            <div className="w-full p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs sm:text-sm text-slate-200 space-y-3 animate-fade-in">
              <p className="font-bold text-sky-300 flex items-center gap-1.5">
                <span>📱 Comment installer sur votre appareil :</span>
              </p>

              {isIOS ? (
                <ol className="space-y-2 list-decimal list-inside text-slate-300 text-[13px]">
                  <li>
                    Appuyez sur le bouton <strong>Partager</strong> <span className="inline-block px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-xs">⎋</span> en bas de Safari.
                  </li>
                  <li>
                    Faites défiler le menu vers le bas et appuyez sur <strong>« Sur l&apos;écran d&apos;accueil »</strong> <span className="inline-block px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-xs">⊞</span>.
                  </li>
                  <li>
                    Appuyez sur <strong>« Ajouter »</strong> en haut à droite.
                  </li>
                </ol>
              ) : (
                <ol className="space-y-2 list-decimal list-inside text-slate-300 text-[13px]">
                  <li>
                    Cliquez sur les <strong>trois points verticaux ⋮</strong> ou l&apos;icône <strong>Installer ⊕</strong> dans la barre d&apos;adresse.
                  </li>
                  <li>
                    Sélectionnez <strong>« Installer Banza AI »</strong> ou <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>.
                  </li>
                  <li>
                    Confirmez l&apos;installation pour lancer l&apos;application en mode dédié.
                  </li>
                </ol>
              )}
            </div>
          )}

          {/* Option de contournement / continuer vers le Web */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onInstalledOrBypass}
              className="text-xs text-slate-400 hover:text-slate-200 transition inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              <span>Continuer dans le navigateur sans installer</span>
              <IconArrowRight width={12} height={12} />
            </button>
          </div>
        </div>

        {/* Footer discret */}
        <p className="mt-8 text-[11px] text-slate-400 text-center">
          Banza AI · Version PWA 1.2 · Compatible Android, iOS, Windows, macOS & Linux
        </p>
      </div>
    </div>
  );
}
