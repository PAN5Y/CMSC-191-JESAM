/**
 * ChatInput.tsx
 *
 * The bottom input bar of the AI Chatbot.  Matches the screenshot design:
 *  - A circular gold "+" button on the left (placeholder for attachment)
 *  - A wide pill-shaped textarea in the center
 *  - A circular navy send button on the right (arrow icon)
 *
 * BEHAVIOUR:
 *  - Enter (without Shift) submits the message.
 *  - Shift+Enter inserts a newline.
 *  - The send button is disabled while isLoading is true.
 *  - Auto-grows up to ~4 lines then scrolls, keeping the layout stable.
 *
 * WHY A TEXTAREA INSTEAD OF INPUT:
 *  Academic users often paste multi-sentence questions.  A textarea lets
 *  them see their full question before sending without horizontal scrolling.
 */

import { Send, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  placeholder = "Ask about formatting, related papers, or submission...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea height based on content.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Clamp between one line (~24px) and four lines (~96px).
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 bg-white border-t border-gray-200"
      style={{ boxShadow: "0 -1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Attachment / Plus button */}
      <button
        type="button"
        aria-label="Attach file"
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
        style={{ background: "#F5C344" }}
        // Placeholder — attachment not yet implemented
        onClick={() => alert("File attachment coming soon.")}
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* Text input */}
      <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={`
            flex-1 bg-transparent resize-none outline-none text-sm text-gray-800
            placeholder:text-gray-400 leading-6 max-h-24 overflow-y-auto
            disabled:opacity-50
          `}
          style={{ fontFamily: "'Public Sans', sans-serif" }}
        />
      </div>

      {/* Send button */}
      <button
        type="button"
        aria-label="Send message"
        onClick={handleSend}
        disabled={!value.trim() || isLoading}
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          text-white transition-all
          ${
            !value.trim() || isLoading
              ? "opacity-40 cursor-not-allowed"
              : "hover:opacity-90 active:scale-95"
          }
        `}
        style={{ background: "#3f4b7e" }}
      >
        {isLoading ? (
          // Spinner while waiting for response
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}

export default ChatInput;
