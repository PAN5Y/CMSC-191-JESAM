import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ArticleAssistantComposerProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export function ArticleAssistantComposer({
  onSend,
  isLoading,
}: ArticleAssistantComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = textareaRef.current;

    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="border-t border-[#d8deef] bg-white px-4 py-4">
      <div className="flex items-end gap-3 rounded-[1.6rem] border border-[#d8deef] bg-[#f8faff] px-4 py-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          disabled={isLoading}
          placeholder="Ask about this article or search for related JESAM papers..."
          className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 disabled:opacity-60"
          style={{ fontFamily: "'Public Sans', sans-serif" }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className={`flex size-10 items-center justify-center rounded-full text-white transition ${
            !value.trim() || isLoading
              ? "cursor-not-allowed bg-[#94a0c9]"
              : "bg-[#24315f] hover:bg-[#1d2548]"
          }`}
          aria-label="Send article assistant message"
        >
          {isLoading ? (
            <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
