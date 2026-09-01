import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./BrandLogo";
import MarkdownRenderer from "./MarkdownRenderer";
import ImageGallery from "./ImageGallery";
import {
  IconCheck,
  IconCopy,
  IconPaperclip,
  IconRefresh,
  IconThumbsDown,
  IconThumbsUp,
} from "./icons";
import type { ChatMessage } from "@/lib/types";
import { sanitizeAssistantAnswer } from "@/lib/sanitize";

interface Props {
  message: ChatMessage;
  streaming?: boolean;
  onRegenerate?: () => void;
}

export default function MessageBubble({ message, streaming = false, onRegenerate }: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const content = isUser ? message.content : sanitizeAssistantAnswer(message.content);

  useEffect(() => {
    if (streaming && ref.current) {
      ref.current.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [message.content, streaming]);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // presse-papiers
    }
  }

  if (isUser) {
    return (
      <div className="mx-auto mt-2 flex max-w-full w-full justify-end px-2 sm:px-4" ref={ref}>
        <div className="bubble-in max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-card break-words sm:max-w-[75%] font-normal select-text">
          {message.attachment && (
            <div className="mb-2 overflow-hidden rounded-xl border border-white/20 bg-black/15 p-2 backdrop-blur-sm">
              {message.attachment.type === "image" && (message.attachment.previewUrl || message.attachment.url) ? (
                <img
                  src={message.attachment.previewUrl || message.attachment.url}
                  alt={message.attachment.name}
                  className="max-h-56 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium text-white/95">
                  <IconPaperclip width={15} height={15} className="shrink-0" />
                  <span className="truncate">{message.attachment.name}</span>
                </div>
              )}
            </div>
          )}
          {message.content}
        </div>
      </div>
    );
  }

  const readable = ["assistant", "system"].includes(message.role);

  return (
    <div className="group/view mx-auto mt-3 flex w-full max-w-full items-start gap-3 px-2 sm:px-4" ref={ref}>
      <span className="mt-0.5 shrink-0">
        <BrandMark width={32} height={32} className="h-8 w-8 rounded-xl shadow-glow-subtle" />
      </span>

      <div className="min-w-0 max-w-full flex-1">
        {!streaming && readable && (
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[12.5px] font-bold tracking-tight text-ink">Banza AI</span>

            <span className="mx-0.5 text-ink-3">·</span>

            <button
              type="button"
              onClick={copyMessage}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs text-ink-3 transition hover:bg-surface-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Copier la réponse"
            >
              {copied ? (
                <>
                  <IconCheck width={13} height={13} className="text-accent" /> Copié
                </>
              ) : (
                <IconCopy width={13} height={13} />
              )}
            </button>

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="rounded-lg p-1 text-ink-3 transition hover:bg-surface-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Régénérer la réponse"
                title="Régénérer"
              >
                <IconRefresh width={14} height={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setVoted((v) => (v === "up" ? null : "up"))}
              className="rounded-lg p-1 text-ink-3 transition hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent"
              aria-pressed={voted === "up"}
              aria-label="Réponse utile"
              title="Utile"
            >
              <IconThumbsUp width={14} height={14} className={voted === "up" ? "text-accent" : undefined} />
            </button>
            <button
              type="button"
              onClick={() => setVoted((v) => (v === "down" ? null : "down"))}
              className="rounded-lg p-1 text-ink-3 transition hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent"
              aria-pressed={voted === "down"}
              aria-label="Réponse inutile"
              title="Pas utile"
            >
              <IconThumbsDown width={14} height={14} className={voted === "down" ? "text-danger" : undefined} />
            </button>
          </div>
        )}

        {content ? (
          <div className="message-enter">
            <MarkdownRenderer content={content} />
            {streaming && <span className="stream-caret ml-1 inline-block h-[1.15rem] w-[6px] rounded-sm bg-accent align-text-bottom" />}
          </div>
        ) : (
          <TypingIndicator />
        )}

        {/* Galerie de photos / images Web */}
        {message.images && message.images.length > 0 && (
          <ImageGallery images={message.images} />
        )}

        {/* Image générée par IA rattachée */}
        {message.image && message.image.url && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface-2/60 p-3 shadow-sm">
            <img
              src={message.image.url}
              alt={message.image.title || "Image générée par IA"}
              className="max-h-[500px] w-full rounded-xl object-contain"
              loading="lazy"
            />
          </div>
        )}

        {/* Citations / Sources Web */}
        {!streaming && message.sources && message.sources.length > 0 && (
          <div className="bubble-in mt-3 rounded-2xl border border-line bg-surface-2/70 p-3.5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
              Sources Web vérifiées ({message.sources.length})
            </p>
            <ul className="mt-2 space-y-1.5">
              {message.sources.map((s, i) => (
                <li key={`${s.url}-${i}`} className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-[11px] font-mono tabular-nums text-ink-3">{i + 1}.</span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.url}
                    className="flex min-w-0 items-center gap-2 text-[13px] text-accent hover:underline decoration-accent/40 hover:decoration-accent"
                  >
                    <span className="truncate">{s.title || s.domain || s.url}</span>
                    {s.domain && (
                      <span className="shrink-0 rounded-md border border-accent/20 bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-medium text-accent">
                        {s.domain}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message-enter flex items-center gap-2.5 py-2.5">
      <div className="flex gap-1.5">
        <span className="typing-dot h-2 w-2 rounded-full bg-accent" />
        <span className="typing-dot h-2 w-2 rounded-full bg-accent" />
        <span className="typing-dot h-2 w-2 rounded-full bg-accent" />
      </div>
      <span className="text-xs font-medium italic text-ink-3">Banza prépare votre réponse…</span>
    </div>
  );
}