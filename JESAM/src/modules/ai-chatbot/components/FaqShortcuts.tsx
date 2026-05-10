/**
 * FaqShortcuts.tsx
 *
 * Renders the row of quick-question chip buttons shown directly below the
 * welcome message.  Clicking a chip fires that question as a user message
 * without requiring the user to type.
 *
 * WHY SEPARATE FROM AIChatbotPage:
 *  Keeping this component separate makes it trivially reusable if JESAM
 *  later wants FAQ shortcuts on other pages (e.g. the Submission form's
 *  help sidebar).
 *
 * DESIGN:
 *  Light gray pill buttons with hover darkening.  Consistent with the
 *  "Quick questions" styling in the screenshot.
 */

import type { FaqShortcut } from "../types";

interface FaqShortcutsProps {
  shortcuts: FaqShortcut[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function FaqShortcuts({ shortcuts, onSelect, disabled }: FaqShortcutsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {shortcuts.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onSelect(s.prompt)}
          disabled={disabled}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-colors
            border border-gray-200 bg-gray-50
            hover:bg-gray-100 hover:border-gray-300
            disabled:opacity-40 disabled:cursor-not-allowed
            whitespace-nowrap
          `}
          style={{ fontFamily: "'Public Sans', sans-serif", color: "#3f4b7e" }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export default FaqShortcuts;
