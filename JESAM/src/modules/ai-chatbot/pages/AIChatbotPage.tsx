// AIChatbotPage.tsx  (src/modules/ai-chatbot/pages/AIChatbotPage.tsx)

import { RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";

import { ChatInput } from "../components/ChatInput";
import { FaqShortcuts } from "../components/FaqShortcuts";
import { MessageBubble } from "../components/MessageBubble";
import { useChat } from "../hooks/useChat";
import { FAQ_SHORTCUTS } from "../lib/chatbot-config";

// ---------------------------------------------------------------------------
// Helper: format today's date in the header style "April 10, 2026"
// ---------------------------------------------------------------------------
function formatHeaderDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AIChatbotPage() {
  const { messages, isLoading, sendMessage, clearChat } = useChat();

  // Scroll-to-bottom anchor
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // Scroll down whenever the message count changes (new message added).
  // We intentionally do NOT depend on messages directly to avoid
  // scrolling on every streaming token.
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    /*
     * The page fills the area to the right of the 256px sidebar.
     * It uses flex-col so the message list can flex-grow and the input
     * stays pinned at the bottom.
     */
    <div
      className="flex flex-col h-screen bg-gray-50"
      style={{ fontFamily: "'Public Sans', sans-serif" }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between px-8 py-6 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Newsreader', serif" }}
          >
            AI Chatbot
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">For inquiries and assistance</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Last updated timestamp */}
          <span className="text-xs text-gray-400">
            Last updated: {formatHeaderDate()}
          </span>

          {/* Clear / reset conversation */}
          <button
            type="button"
            onClick={clearChat}
            title="Start a new conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            New chat
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Non-authoritative disclaimer banner                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="mx-8 mt-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex-shrink-0">
        <span className="font-semibold">Note:</span> This assistant is intentionally
        non-authoritative. It provides guidance and information — final editorial
        decisions remain with human editors.
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Message list (scrollable)                                           */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex-1 overflow-y-auto px-8 py-6 space-y-5"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/*
         * Typing indicator — shown while we wait for the first streaming
         * token to arrive (before the placeholder gets any text).
         */}
        {isLoading &&
          messages[messages.length - 1]?.isStreaming &&
          messages[messages.length - 1]?.text === "" && (
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                style={{ background: "#3f4b7e", fontFamily: "'Newsreader', serif" }}
              >
                J
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Bottom anchor for auto-scroll */}
        <div ref={scrollAnchorRef} aria-hidden="true" />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ shortcuts                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-8 py-3 bg-white border-t border-gray-100 flex-shrink-0">
        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
          Quick questions
        </p>
        <FaqShortcuts
          shortcuts={FAQ_SHORTCUTS}
          onSelect={sendMessage}
          disabled={isLoading}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Chat input                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-shrink-0">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
