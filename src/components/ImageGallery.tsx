import { useState, useEffect, useCallback } from "react";
import type { ChatImageItem } from "@/lib/types";
import {
  IconArrowUpRight,
  IconChevronLeft,
  IconChevronRight,
  IconImage,
  IconX,
} from "./icons";

interface Props {
  images: ChatImageItem[];
}

export default function ImageGallery({ images }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const handleImageError = useCallback((url: string) => {
    setFailedUrls((prev) => new Set(prev).add(url));
  }, []);

  const validImages = images.filter((img) => img.url && !failedUrls.has(img.url));

  const handleOpenLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const handleCloseLightbox = () => {
    setSelectedIndex(null);
  };

  const handlePrev = useCallback(() => {
    if (selectedIndex === null || validImages.length === 0) return;
    setSelectedIndex((prev) => (prev === 0 ? validImages.length - 1 : (prev ?? 1) - 1));
  }, [selectedIndex, validImages.length]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null || validImages.length === 0) return;
    setSelectedIndex((prev) => (prev === validImages.length - 1 ? 0 : (prev ?? 0) + 1));
  }, [selectedIndex, validImages.length]);

  // Gestion des raccourcis clavier dans la Lightbox
  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseLightbox();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handlePrev, handleNext]);

  if (images.length === 0) {
    return null;
  }

  const currentImage = selectedIndex !== null ? validImages[selectedIndex] : null;

  return (
    <div className="mt-3.5 overflow-hidden rounded-2xl border border-line bg-surface-2/60 p-3 sm:p-4 shadow-sm">
      {/* En-tête de la galerie */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-3">
          <IconImage width={14} height={14} className="text-accent" />
          <span>Photos du Web ({validImages.length})</span>
        </div>
        <span className="text-[11px] text-ink-3">Cliquez pour agrandir</span>
      </div>

      {/* Grille responsive de miniatures */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, idx) => {
          const isFailed = failedUrls.has(img.url);
          const validIdx = validImages.findIndex((v) => v.url === img.url);

          if (isFailed) {
            return null;
          }

          const displayThumb = img.thumbnail_url || img.url;
          const sourceName = img.source_name || "Source Web";

          return (
            <div
              key={`${img.url}-${idx}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-line/80 bg-surface shadow-sm transition hover:border-accent/60 hover:shadow-md cursor-pointer"
              onClick={() => validIdx !== -1 && handleOpenLightbox(validIdx)}
            >
              {/* Conteneur image miniature */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
                <img
                  src={displayThumb}
                  alt={img.title || "Photo du Web"}
                  loading="lazy"
                  decoding="async"
                  onError={() => handleImageError(img.url)}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Voile sombre au survol */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                {/* Badge Source en surimpression */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between opacity-90 transition-opacity">
                  <span className="max-w-[85%] truncate rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                    {sourceName}
                  </span>
                </div>
              </div>

              {/* Titre / légende sous l'image */}
              {img.title && (
                <div className="p-2">
                  <p className="line-clamp-1 text-[11.5px] font-medium text-ink-2 group-hover:text-ink transition-colors" title={img.title}>
                    {img.title}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODALE LIGHTBOX PLEIN ÉCRAN */}
      {selectedIndex !== null && currentImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu d'image"
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 p-4 backdrop-blur-md transition-opacity animate-fade-in"
          onClick={handleCloseLightbox}
        >
          {/* Barre supérieure Lightbox */}
          <div
            className="flex w-full max-w-5xl items-center justify-between py-2 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold tracking-wide">
                {selectedIndex + 1} / {validImages.length}
              </span>
              {currentImage.source_name && (
                <span className="text-xs text-white/70">
                  Source : <strong className="text-white">{currentImage.source_name}</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleCloseLightbox}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Fermer la prévisualisation"
            >
              <IconX width={20} height={20} />
            </button>
          </div>

          {/* Zone Image Centrale avec navigation */}
          <div
            className="relative flex flex-1 w-full max-w-5xl items-center justify-center overflow-hidden py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Précédent */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 z-10 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/80 hover:scale-110 active:scale-95"
                aria-label="Photo précédente"
              >
                <IconChevronLeft width={22} height={22} />
              </button>
            )}

            {/* Image Agrandie */}
            <div className="flex h-full w-full items-center justify-center">
              <img
                src={currentImage.url}
                alt={currentImage.title || "Photo du Web agrandie"}
                className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl transition-all"
                onError={() => handleImageError(currentImage.url)}
              />
            </div>

            {/* Bouton Suivant */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 z-10 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/80 hover:scale-110 active:scale-95"
                aria-label="Photo suivante"
              >
                <IconChevronRight width={22} height={22} />
              </button>
            )}
          </div>

          {/* Barre inférieure : Titre et Lien vers la source */}
          <div
            className="flex w-full max-w-5xl flex-col items-center justify-between gap-3 rounded-2xl bg-white/10 p-3.5 text-white backdrop-blur-md sm:flex-row sm:px-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="line-clamp-2 text-sm font-semibold text-white/95">
                {currentImage.title || "Image provenant du Web"}
              </p>
              {currentImage.source_name && (
                <p className="mt-0.5 text-xs text-white/60">
                  Origine : {currentImage.source_name}
                </p>
              )}
            </div>

            {/* Actions : Visiter la page source / Ouvrir en taille réelle */}
            <div className="flex shrink-0 items-center gap-2">
              {currentImage.source_url && (
                <a
                  href={currentImage.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover shadow-sm"
                >
                  <span>Visiter la source</span>
                  <IconArrowUpRight width={14} height={14} />
                </a>
              )}

              <a
                href={currentImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
                title="Ouvrir l'image en pleine résolution"
              >
                Plein écran
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
