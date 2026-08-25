"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { IconPaperclip, IconSend, IconStop } from "./icons";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  generating: boolean;
  disabled?: boolean;
  initialValue?: string;
  onAttachmentClick?: () => void;
}

export default function ChatInput({
  onSend,
  onStop,
  generating,
  disabled,
  initialValue = "",
  onAttachmentClick,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue && initialValue !== value) {
      setValue(initialValue);
      requestAnimationFrame(() => autoResize());
    }
  }, [initialValue]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }

  function submit() {
    const text = value.trim();
    if (!text || generating || disabled) return;
    setValue("");
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
    onSend(text);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !generating) {
      e.preventDefault();
      submit();
    }
  }

  const hasValue = value.trim().length > 0;

  return (
    <div className="border-t border-line/80 bg-surface/85 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2.5">
        <div className="relative flex min-h-[48px] flex-1 items-center rounded-2xl border border-line-strong bg-surface px-3 py-1.5 shadow-sm transition duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              setValue(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question à Banza AI…"
            enterKeyHint="send"
            className="scroll-thin max-h-44 min-h-[36px] w-full resize-none bg-transparent px-1 py-1.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-3 outline-none"
          />
        </div>

        {generating ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Arrêter la génération"
            title="Arrêter la génération"
            className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-ink text-white shadow-sm transition hover:bg-ink-2 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <IconStop width={18} height={18} />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onAttachmentClick}
              aria-label="Ajouter une pièce jointe"
              title="Ajouter un document (Compte requis)"
              className="flex h-[48px] w-[44px] shrink-0 items-center justify-center rounded-2xl text-ink-3 hover:bg-surface-2 hover:text-ink transition active:scale-95"
            >
              <IconPaperclip width={18} height={18} />
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!hasValue || disabled}
              aria-label="Envoyer le message"
              title="Envoyer"
              className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-accent text-white shadow-card transition-all duration-200 hover:bg-accent-strong hover:shadow-card-hover active:scale-95 disabled:bg-surface-2 disabled:text-ink-3 disabled:border disabled:border-line disabled:shadow-none disabled:cursor-not-allowed focus-visible:ring-4 focus-visible:ring-accent/25"
            >
              <IconSend width={18} height={18} />
            </button>
          </div>
        )}
      </div>
      <p className="mx-auto hidden max-w-3xl pt-2 pb-0.5 text-center text-[11px] text-ink-3 sm:block">
        Banza  peut faire des erreurs. Vérifiez les informations critiques.
      </p>
    </div>
  );
}