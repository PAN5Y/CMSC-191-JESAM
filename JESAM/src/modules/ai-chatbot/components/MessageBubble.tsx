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
 *  - Newlines in the assistant's text are rendered as <br> tags so the
 *    markdown-lite output (bullet lists via •) displays correctly.
 *  - The streaming cursor (blinking |) is appended when isStreaming=true.
 *  - Manuscript results are rendered as a compact table below the text.
 */

import { Bot, User } from "lucide-react";
import type { ChatMessage, ManuscriptSearchResult } from "../types";

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
                    // TODO: navigate to manuscript detail page
                    // Using the global router would require importing useNavigate
                    // from react-router.  For now, we open a placeholder alert.
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
// Helper: render assistant text with newline support
// ---------------------------------------------------------------------------

function AssistantText({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming?: boolean;
}) {
  // Split on newlines; map blank lines to paragraph gaps.
  const lines = text.split("\n");
  return (
    <p
      className="text-sm text-gray-800 leading-relaxed"
      style={{ fontFamily: "'Public Sans', sans-serif" }}
    >
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-[#3f4b7e] ml-0.5 animate-pulse" />
      )}
    </p>
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

            {/* "Found N manuscripts" header when results exist */}
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
