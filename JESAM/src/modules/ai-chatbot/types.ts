/**
 * Type definitions for the JESAM AI Chatbot module.
 *
 * These are intentionally kept separate from the global src/types.ts so the
 * chatbot module stays self-contained and easy to extend independently.
 */

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  /** Full rendered text of the message. May be empty while streaming. */
  text: string;
  /** True while the assistant is still receiving tokens for this message. */
  isStreaming?: boolean;
  /** ISO timestamp */
  createdAt: string;
  /** Optional structured data attached to an assistant message (e.g. manuscript results) */
  manuscriptResults?: ManuscriptSearchResult[];
}

export interface ManuscriptSearchResult {
  id: string;
  referenceCode: string;
  title: string;
  authors: string[];
  classification: string;
  status: string;
}

/** A single FAQ shortcut button shown below the welcome message */
export interface FaqShortcut {
  label: string;
  prompt: string;
}

/** Shape expected by the Claude /v1/messages API (messages array item) */
export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}
