import {
  ClipboardEvent,
  DragEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { IconPaperclip, IconSend, IconStop, IconX } from "./icons";

interface Props {
  onSend: (text: string, file?: File | null) => void;
  onStop: () => void;
  generating: boolean;
  disabled?: boolean;
  initialValue?: string;
  isGuest?: boolean;
  attachedFile?: File | null;
  onFileSelect?: (file: File | null) => void;
  onAttachmentClick?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ChatInput({
  onSend,
  onStop,
  generating,
  disabled,
  initialValue = "",
  isGuest = false,
  attachedFile = null,
  onFileSelect,
  onAttachmentClick,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue && initialValue !== value) {
      setValue(initialValue);
      requestAnimationFrame(() => autoResize());
    }
  }, [initialValue]);

  // Génération de l'aperçu si l'image est sélectionnée
  useEffect(() => {
    if (attachedFile && attachedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(attachedFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [attachedFile]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }

  function submit() {
    const text = value.trim();
    if ((!text && !attachedFile) || generating || disabled) return;
    const toSendText = text;
    const toSendFile = attachedFile;

    setValue("");
    if (onFileSelect) onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
    onSend(toSendText, toSendFile);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !generating) {
      e.preventDefault();
      submit();
    }
  }

  function handlePaperclipClick() {
    if (isGuest) {
      // Les invités sont invités à se connecter/créer un compte
      onAttachmentClick?.();
      return;
    }
    // Utilisateur authentifié : déclenchement du sélecteur de fichiers
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
  }

  function handleRemoveAttachment() {
    onFileSelect?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Support du collage direct d'images (Ctrl+V)
  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    if (isGuest) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          onFileSelect?.(file);
          break;
        }
      }
    }
  }

  // Support du Glisser-Déposer (Drag and drop)
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!isGuest && !isDragging) setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (isGuest) {
      onAttachmentClick?.();
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
  }

  const hasValue = value.trim().length > 0 || attachedFile !== null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-t border-line/80 bg-surface/85 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-colors sm:px-6 ${
        isDragging ? "bg-accent-soft/30 border-accent" : ""
      }`}
    >
      {/* Input de fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,.pdf,.txt,.md,.csv,.json,.doc,.docx"
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {/* Aperçu de la pièce jointe */}
        {attachedFile && (
          <div className="flex items-center gap-3 self-start rounded-2xl border border-line-strong bg-surface-2/90 px-3 py-2 shadow-sm animate-fade-in">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={attachedFile.name}
                className="h-10 w-10 shrink-0 rounded-lg object-cover border border-line"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <IconPaperclip width={20} height={20} />
              </div>
            )}

            <div className="min-w-0 max-w-[240px] sm:max-w-xs">
              <p className="truncate text-xs font-semibold text-ink" title={attachedFile.name}>
                {attachedFile.name}
              </p>
              <p className="text-[11px] text-ink-3">
                {formatFileSize(attachedFile.size)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemoveAttachment}
              className="ml-1 rounded-full p-1 text-ink-3 hover:bg-surface hover:text-ink transition"
              title="Supprimer la pièce jointe"
              aria-label="Supprimer le fichier"
            >
              <IconX width={16} height={16} />
            </button>
          </div>
        )}

        <div className="flex w-full items-end gap-2.5">
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
              onPaste={handlePaste}
              placeholder={
                attachedFile
                  ? "Ajoutez des instructions ou posez une question sur ce fichier…"
                  : "Posez une question à Banza AI…"
              }
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
                onClick={handlePaperclipClick}
                aria-label="Ajouter une pièce jointe"
                title={
                  isGuest
                    ? "Ajouter un document ou une image (Compte requis)"
                    : "Ajouter un document ou une image"
                }
                className={`flex h-[48px] w-[44px] shrink-0 items-center justify-center rounded-2xl transition active:scale-95 ${
                  attachedFile
                    ? "bg-accent-soft text-accent"
                    : "text-ink-3 hover:bg-surface-2 hover:text-ink"
                }`}
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
      </div>
      <p className="mx-auto hidden max-w-3xl pt-2 pb-0.5 text-center text-[11px] text-ink-3 sm:block">
        Banza peut faire des erreurs. Vérifiez les informations critiques.
      </p>
    </div>
  );
}