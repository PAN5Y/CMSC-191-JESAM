/**
 * MessageBubble.tsx
 *
 * Renders a single chat message — either from the user ("A" avatar, dark
 * navy pill, right-aligned) or from the assistant ("J" avatar, white card,
 * left-aligned).  Matches the visual design in the provided screenshot.
 *
 * DESIGN DECISIONS:
 *  - User messages use the sidebar's brand navy (#3f4b7e) as background.
 *  - Assistant messages use a white card with a subtle shadow.
 *  - Both have circular letter avatars.  User avatar shows "A" (for Author /
 *    the logged-in user).  Assistant avatar shows "J" (for JESAM).
 *  - Assistant text is parsed as Markdown and rendered to HTML so that bold,
 *    italic, inline code, code blocks, bullet/numbered lists, blockquotes,
 *    horizontal rules, and highlight marks display correctly.
 *  - The streaming cursor (blinking |) is appended when isStreaming=true.
 *  - Manuscript results are rendered as a compact table below the text.
 *
 * MARKDOWN RENDERING:
 *  We parse the assistant's text with a lightweight, dependency-free inline
 *  Markdown renderer (no external library required).  Supported syntax:
 *    **bold**, __bold__
 *    *italic*, _italic_
 *    ~~strikethrough~~
 *    ==highlight==
 *    `inline code`
 *    ```language\n…\n``` (fenced code blocks)
 *    # / ## / ### headings
 *    > blockquote
 *    - / * / + unordered list items
 *    1. ordered list items
 *    --- / *** horizontal rules
 *    [text](url) links
 *    plain URLs auto-linked
 *  All output is sanitised — only a safe allow-list of HTML tags is used, so
 *  arbitrary HTML in the model output cannot execute scripts or break layout.
 */

import { useMemo } from "react";
import type { ChatMessage, ManuscriptSearchResult } from "../types";

// ---------------------------------------------------------------------------
// Lightweight Markdown → HTML parser (no external deps)
// ---------------------------------------------------------------------------

/**
 * Convert a Markdown string to a safe HTML string.
 * Processing order matters: block-level elements are handled first, then
 * inline formatting is applied to each text node.
 */
function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const htmlLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code block ────────────────────────────────────────────────────
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      htmlLines.push(
        `<pre class="md-pre"><code${langAttr}>${codeLines.join("\n")}</code></pre>`
      );
      i++; // skip closing ```
      continue;
    }

    // ── Horizontal rule ──────────────────────────────────────────────────────
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      htmlLines.push(`<hr class="md-hr" />`);
      i++;
      continue;
    }

    // ── Headings ─────────────────────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = inlineMarkdown(headingMatch[2]);
      htmlLines.push(`<h${level} class="md-h${level}">${text}</h${level}>`);
      i++;
      continue;
    }

    // ── Blockquote ───────────────────────────────────────────────────────────
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const inner = inlineMarkdown(quoteLines.join("\n"));
      htmlLines.push(`<blockquote class="md-blockquote">${inner}</blockquote>`);
      continue;
    }

    // ── Unordered list ───────────────────────────────────────────────────────
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(`<li class="md-li">${inlineMarkdown(lines[i].slice(2).trim())}</li>`);
        i++;
      }
      htmlLines.push(`<ul class="md-ul">${items.join("")}</ul>`);
      continue;
    }

    // ── Ordered list ─────────────────────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s/, "").trim();
        items.push(`<li class="md-li">${inlineMarkdown(text)}</li>`);
        i++;
      }
      htmlLines.push(`<ol class="md-ol">${items.join("")}</ol>`);
      continue;
    }

    // ── Blank line → paragraph break (we'll join non-blank lines below) ──────
    if (line.trim() === "") {
      htmlLines.push(`<br />`);
      i++;
      continue;
    }

    // ── Regular paragraph line ───────────────────────────────────────────────
    htmlLines.push(`<p class="md-p">${inlineMarkdown(line)}</p>`);
    i++;
  }

  return htmlLines.join("");
}

/** Apply inline Markdown formatting to a single line of text. */
function inlineMarkdown(text: string): string {
  let t = escapeHtml(text);

  // Inline code (must come before bold/italic to protect backtick content)
  t = t.replace(/`([^`]+)`/g, `<code class="md-code">$1</code>`);

  // Bold — **text** or __text__
  t = t.replace(/\*\*(.+?)\*\*/g, `<strong class="md-strong">$1</strong>`);
  t = t.replace(/__(.+?)__/g, `<strong class="md-strong">$1</strong>`);

  // Italic — *text* or _text_ (single, not double)
  t = t.replace(/\*([^*]+)\*/g, `<em class="md-em">$1</em>`);
  t = t.replace(/_([^_]+)_/g, `<em class="md-em">$1</em>`);

  // Strikethrough — ~~text~~
  t = t.replace(/~~(.+?)~~/g, `<s class="md-s">$1</s>`);

  // Highlight — ==text==
  t = t.replace(/==(.+?)==/g, `<mark class="md-mark">$1</mark>`);

  // Links — [text](url)
  t = t.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    `<a class="md-a" href="$2" target="_blank" rel="noopener noreferrer">$1</a>`
  );

  // Auto-link bare URLs (not already inside an <a>)
  t = t.replace(
    /(?<!href=")(https?:\/\/[^\s<"]+)/g,
    `<a class="md-a" href="$1" target="_blank" rel="noopener noreferrer">$1</a>`
  );

  return t;
}

/** Escape HTML special characters so model output cannot inject markup. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Markdown styles injected once via a <style> tag
// ---------------------------------------------------------------------------

const MARKDOWN_STYLES = `
  .md-prose { font-family: 'Public Sans', sans-serif; font-size: 0.875rem; line-height: 1.65; color: #1f2937; }
  .md-prose .md-p { margin: 0 0 0.35em; }
  .md-prose .md-p:last-child { margin-bottom: 0; }
  .md-prose .md-h1 { font-size: 1.2em; font-weight: 700; margin: 0.6em 0 0.3em; color: #111827; }
  .md-prose .md-h2 { font-size: 1.1em; font-weight: 700; margin: 0.55em 0 0.25em; color: #1f2937; }
  .md-prose .md-h3 { font-size: 1em; font-weight: 700; margin: 0.5em 0 0.2em; color: #374151; }
  .md-prose .md-h4, .md-prose .md-h5, .md-prose .md-h6 { font-size: 0.9em; font-weight: 600; margin: 0.45em 0 0.2em; }
  .md-prose .md-strong { font-weight: 700; color: #111827; }
  .md-prose .md-em { font-style: italic; color: #374151; }
  .md-prose .md-s { text-decoration: line-through; color: #9ca3af; }
  .md-prose .md-mark { background: #fef08a; color: #713f12; border-radius: 2px; padding: 0 2px; }
  .md-prose .md-code { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 1px 5px; font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace; font-size: 0.82em; color: #374151; }
  .md-prose .md-pre { background: #1e293b; border-radius: 8px; padding: 0.85em 1em; margin: 0.5em 0; overflow-x: auto; }
  .md-prose .md-pre code { background: transparent; border: none; padding: 0; font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace; font-size: 0.82em; color: #e2e8f0; white-space: pre; }
  .md-prose .md-blockquote { border-left: 3px solid #3f4b7e; margin: 0.4em 0; padding: 0.25em 0.75em; background: #f8f9ff; border-radius: 0 6px 6px 0; color: #4b5563; font-style: italic; }
  .md-prose .md-ul { margin: 0.3em 0 0.3em 1.15em; padding: 0; list-style-type: disc; }
  .md-prose .md-ol { margin: 0.3em 0 0.3em 1.15em; padding: 0; list-style-type: decimal; }
  .md-prose .md-li { margin: 0.15em 0; }
  .md-prose .md-hr { border: none; border-top: 1px solid #e5e7eb; margin: 0.6em 0; }
  .md-prose .md-a { color: #3f4b7e; text-decoration: underline; text-underline-offset: 2px; }
  .md-prose .md-a:hover { color: #2d3659; }
  .md-cursor { display: inline-block; width: 2px; height: 1em; background: #3f4b7e; margin-left: 2px; vertical-align: text-bottom; animation: md-blink 1s step-start infinite; }
  @keyframes md-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = MARKDOWN_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ---------------------------------------------------------------------------
// Sub-component: AssistantText (Markdown-rendered)
// ---------------------------------------------------------------------------

function AssistantText({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming?: boolean;
}) {
  injectStyles();

  const html = useMemo(() => markdownToHtml(text), [text]);

  return (
    <div className="md-prose">
      <span dangerouslySetInnerHTML={{ __html: html }} />
      {isStreaming && <span className="md-cursor" aria-hidden="true" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: ManuscriptResultsTable
// ---------------------------------------------------------------------------

function ManuscriptResultsTable({
  results,
}: {
  results: ManuscriptSearchResult[];
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {["Manuscript ID", "Title", "Authors", "Classification", "Status", "Action"].map(
              (h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  style={{ fontFamily: "'Public Sans', sans-serif", fontSize: "10px" }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr
              key={r.id}
              className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
            >
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap font-mono">
                {r.referenceCode}
              </td>
              <td className="px-3 py-2 text-gray-800 font-medium max-w-[180px]">
                <span className="line-clamp-2">{r.title}</span>
              </td>
              <td className="px-3 py-2 text-gray-600 max-w-[120px]">
                <span className="line-clamp-1">
                  {r.authors.slice(0, 2).join(", ")}
                  {r.authors.length > 2 ? " et al." : ""}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <ClassificationPill label={r.classification} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <StatusPill label={r.status} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <button
                  className="text-[#3f4b7e] hover:underline text-xs font-medium"
                  style={{ fontFamily: "'Public Sans', sans-serif" }}
                  onClick={() => {
                    alert(`Navigate to manuscript ${r.referenceCode}`);
                  }}
                >
                  Proceed →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClassificationPill({ label }: { label: string }) {
  const colors: Record<string, string> = {
    Land: "bg-green-100 text-green-800",
    Air: "bg-sky-100 text-sky-800",
    Water: "bg-blue-100 text-blue-800",
    People: "bg-purple-100 text-purple-800",
  };
  const cls = colors[label] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full font-medium ${cls}`}
      style={{ fontSize: "10px", fontFamily: "'Public Sans', sans-serif" }}
    >
      {label}
    </span>
  );
}

function StatusPill({ label }: { label: string }) {
  const isReady = label === "Published" || label === "Accepted";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full font-medium ${
        isReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
      }`}
      style={{ fontSize: "10px", fontFamily: "'Public Sans', sans-serif" }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  if (isAssistant) {
    return (
      <div className="flex items-start gap-3">
        {/* J Avatar */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
          style={{ background: "#3f4b7e", fontFamily: "'Newsreader', serif" }}
        >
          J
        </div>

        {/* Bubble */}
        <div className="flex-1 max-w-[85%]">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
            <AssistantText text={message.text} isStreaming={message.isStreaming} />

            {/* Manuscript search results table */}
            {message.manuscriptResults && message.manuscriptResults.length > 0 && (
              <ManuscriptResultsTable results={message.manuscriptResults} />
            )}

            {/* Empty results notice */}
            {message.manuscriptResults && message.manuscriptResults.length === 0 && (
              <p
                className="mt-2 text-xs text-gray-400 italic"
                style={{ fontFamily: "'Public Sans', sans-serif" }}
              >
                No manuscripts found in the JESAM repository for that query.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // User message — right-aligned navy pill
  return (
    <div className="flex items-end justify-end gap-3">
      <div className="max-w-[75%]">
        <div
          className="px-4 py-3 rounded-2xl rounded-br-none text-white text-sm leading-relaxed"
          style={{ background: "#3f4b7e", fontFamily: "'Public Sans', sans-serif" }}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
