"use client";

import { BrandMark } from "./BrandLogo";
import {
  IconActivity,
  IconArrowUpRight,
  IconCpu,
  IconEdit,
  IconSparkles,
} from "./icons";

interface Props {
  onSend: (text: string) => void;
  /** Prénom de l'utilisateur connecté (absent en mode invité). */
  name?: string;
}

const SUGGESTIONS = [
  { icon: IconEdit, label: "Rédiger", prompt: "Aide-moi à rédiger un e-mail professionnel clair et percutant." },
  { icon: IconActivity, label: "Analyser", prompt: "Analyse les avantages et les enjeux de l'intelligence artificielle pour une entreprise." },
  { icon: IconSparkles, label: "Créer", prompt: "Propose-moi 3 concepts novateurs et percutants pour un projet tech." },
  { icon: IconCpu, label: "Coder", prompt: "Écris une fonction moderne en TypeScript pour filtrer et trier des données complexes." },
];

const EXAMPLES = [
  "Explique-moi le fonctionnement des modèles de langage en termes simples",
  "Quelles sont les meilleures pratiques pour optimiser la performance d'une application web ?",
];

export default function WelcomeScreen({ onSend, name }: Props) {
  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Bonne nuit" : hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const firstName = name && name.trim() ? name.trim().split(/\s+/)[0] : undefined;

  return (
    <div className="welcome-enter relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-8 text-center sm:px-6">
      {/* Halo lumineux bleu nuit & noir */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-[65%] rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.22),transparent_70%)] animate-pulse-glow"
      />

      {/* Logo Banza AI officiel en majesté */}
      <div className="brand-halo relative animate-float">
        <div className="rounded-2xl bg-surface/80 p-2 backdrop-blur-xl border border-line-strong shadow-glow">
          <BrandMark width={72} height={72} className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl" />
        </div>
      </div>

      <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {firstName ? `${greeting}, ${firstName}` : greeting}{" "}
        <span className="inline-block animate-wave">👋</span>
      </h1>
      <p className="mt-2 max-w-md text-balance text-[15px] leading-relaxed text-ink-2 sm:text-base">
        {firstName ? (
          <>Ravi de vous revoir <span className="font-bold text-ink">{firstName}</span>. Posez votre
            question, demandez une analyse ou écrivez du code.</>
        ) : (
          <>Je suis <span className="font-bold text-ink">Banza AI</span>. Posez votre
            question, demandez une analyse ou écrivez du code.</>
        )}
      </p>

      {/* Boutons de suggestions rapides */}
      <div className="stagger-enter mt-8 flex max-w-xl flex-wrap items-center justify-center gap-2.5">
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => onSend(s.prompt)}
              className="group inline-flex items-center gap-2 rounded-xl border border-line bg-surface/90 px-4 py-2.5 text-[13.5px] font-medium text-ink-2 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft hover:text-accent hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
            >
              <Icon width={16} height={16} className="text-accent transition-transform group-hover:scale-110" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Exemples concrets */}
      <div className="stagger-enter mt-5 flex w-full max-w-lg flex-col gap-2.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onSend(ex)}
            className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/90 px-4 py-3 text-left text-[13.5px] text-ink-2 shadow-sm backdrop-blur transition-all duration-200 hover:border-accent hover:bg-accent-soft/60 hover:text-ink hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="truncate">{ex}</span>
            <IconArrowUpRight width={15} height={15} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
          </button>
        ))}
      </div>

      <p className="mt-8 text-[11.5px] text-ink-3">
        Aucun compte requis — discutez instantanément et librement.
      </p>
    </div>
  );
}