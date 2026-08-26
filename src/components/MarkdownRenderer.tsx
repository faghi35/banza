import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { IconCheck, IconCopy } from "./icons";

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // presse-papiers indisponible
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line-strong bg-code-bg shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-4 py-2.5">
        <span className="font-mono text-xs font-semibold tracking-wider text-ink-3 uppercase">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Copier le code"
        >
          {copied ? (
            <>
              <IconCheck width={13} height={13} className="text-accent-strong" />
              <span>Copié</span>
            </>
          ) : (
            <>
              <IconCopy width={13} height={13} />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-scroll overflow-x-auto p-4">
        <code className="font-mono text-[13.5px] leading-relaxed text-white">{code}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="md-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            const child = Array.isArray(children) ? children[0] : children;
            const props = (child as { props?: { className?: string; children?: unknown } })
              ?.props;
            const language =
              props?.className?.match(/language-(\w+)/)?.[1] ?? undefined;
            const code = String(props?.children ?? "").replace(/\n$/, "");
            return <CodeBlock code={code} language={language} />;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            return (
              <img src={src} alt={alt ?? ""} className="max-w-full rounded-xl my-3.5 border border-line" loading="lazy" />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}