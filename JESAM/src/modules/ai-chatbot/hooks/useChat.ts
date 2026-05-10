/**
 * useChat.ts
 *
 * Custom React hook that manages the entire chat lifecycle for the JESAM
 * AI Chatbot module.
 *
 * RESPONSIBILITIES:
 *  1. Maintain the messages array (ChatMessage[]) in state.
 *  2. Build the `contents` array passed to the Gemini REST API on each call.
 *  3. Handle streaming responses via the Gemini streamGenerateContent SSE
 *     endpoint and update the assistant message chunk-by-chunk.
 *  4. Detect manuscript search intent before calling Gemini, run the
 *     Supabase search, and attach results to the assistant message.
 *  5. Expose sendMessage, clearChat, and derived UI state (isLoading).
 *
 * REST STREAMING STRATEGY:
 *  The Gemini streamGenerateContent endpoint returns a Server-Sent Events
 *  (SSE) stream. Each event is a JSON-serialised GenerateContentResponse.
 *  We read the raw body via ReadableStream, decode line-by-line, strip the
 *  "data: " prefix from each SSE event, parse the JSON, and extract
 *    response.candidates[0].content.parts[0].text
 *  That text is a DELTA (new text only), so we concatenate into
 *  streamBufferRef and call setMessages on each chunk for live rendering.
 *
 *  We do NOT use useState for the buffer — a ref avoids stale closures
 *  inside the async reading loop.
 *
 * WHY RECONSTRUCT CONTENTS PER CALL:
 *  The Gemini REST API is stateless; conversation history must be sent on
 *  every call inside the `contents` array. Our source of truth is React
 *  state (messages[]), so we derive `contents` fresh on every sendMessage.
 *
 * API ENDPOINT:
 *  POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent
 *  Header: x-goog-api-key: <your key>
 *  Docs:   https://ai.google.dev/api/generate-content#method:-models.streamgeneratecontent
 *
 * ENV VAR:
 *  VITE_GEMINI_API_KEY — your Google AI Studio API key
 */

import { useCallback, useRef, useState } from "react";
import { JESAM_SYSTEM_PROMPT, WELCOME_MESSAGE } from "../lib/chatbot-config";
import {
  extractSearchTerm,
  hasSearchIntent,
  searchManuscripts,
} from "../lib/chatbot-search";
import type { ChatMessage } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Gemini model to use. */
const MODEL = "gemini-2.5-flash";

/** Max output tokens per response. */
const MAX_OUTPUT_TOKENS = 1024;

/** Base URL for the Gemini REST API. */
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

/** Full streaming endpoint. */
const STREAM_URL = `${GEMINI_BASE_URL}/${MODEL}:streamGenerateContent`;

// ---------------------------------------------------------------------------
// Types mirroring the Gemini REST request/response shape
// ---------------------------------------------------------------------------

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiRequestBody {
  system_instruction?: { parts: GeminiPart[] };
  contents: GeminiContent[];
  generationConfig?: {
    maxOutputTokens?: number;
  };
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Helper — build a fresh welcome message
// ---------------------------------------------------------------------------

function makeWelcome(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    text: WELCOME_MESSAGE,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helper — call streamGenerateContent and yield delta text strings
//
// The endpoint returns an SSE stream. Each event looks like:
//   data: { "candidates": [{ "content": { "parts": [{ "text": "..." }] } }] }
//
// We read the raw body line-by-line, strip the "data: " prefix, parse JSON,
// and yield the delta text from each chunk.
// ---------------------------------------------------------------------------

async function* streamGeminiResponse(
  body: GeminiRequestBody,
  apiKey: string
): AsyncGenerator<string> {
  const response = await fetch(`${STREAM_URL}?alt=sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API error ${response.status}: ${errorText}`
    );
  }

  if (!response.body) {
    throw new Error("Gemini API returned an empty body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  // Read until the stream closes.
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines; process complete events.
    const events = buffer.split("\n\n");
    // The last element may be an incomplete event — keep it in the buffer.
    buffer = events.pop() ?? "";

    for (const event of events) {
      // Each SSE event may have multiple lines; find the "data:" line.
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice("data: ".length).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const chunk = JSON.parse(jsonStr) as GeminiStreamChunk;
          const deltaText =
            chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (deltaText) yield deltaText;
        } catch {
          // Malformed JSON in a chunk — skip silently.
        }
      }
    }
  }

  // Process any remaining data left in the buffer after the stream closes.
  for (const line of buffer.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const jsonStr = line.slice("data: ".length).trim();
    if (!jsonStr || jsonStr === "[DONE]") continue;
    try {
      const chunk = JSON.parse(jsonStr) as GeminiStreamChunk;
      const deltaText =
        chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (deltaText) yield deltaText;
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([makeWelcome()]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Accumulated streaming text lives in a ref, not state, so the async
   * generator loop always reads the current value without stale closure issues.
   */
  const streamBufferRef = useRef<string>("");

  // -------------------------------------------------------------------------
  // sendMessage
  // -------------------------------------------------------------------------

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isLoading) return;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

      // 1. Append the user message immediately for a responsive UI.
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: userText.trim(),
        createdAt: new Date().toISOString(),
      };

      // 2. Create an empty assistant placeholder that the stream will fill.
      const assistantId = `a-${Date.now()}`;
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        text: "",
        isStreaming: true,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setIsLoading(true);
      streamBufferRef.current = "";

      try {
        // 3. Optional manuscript search — runs before the LLM call so results
        //    can be injected into the user's message as grounding context.
        let manuscriptResults = undefined;
        let searchContext = "";

        if (hasSearchIntent(userText)) {
          const term = extractSearchTerm(userText);
          const results = await searchManuscripts(term);

          if (results.length > 0) {
            manuscriptResults = results;
            searchContext = `\n\n[SYSTEM CONTEXT — manuscript search results for "${term}"]\n`;
            searchContext += `Found ${results.length} result(s):\n`;
            results.forEach((r, i) => {
              searchContext += `${i + 1}. "${r.title}" — ${r.authors.join(", ") || "Unknown"} — ${r.classification} — ${r.status}\n`;
            });
            searchContext += `[END SYSTEM CONTEXT]\n`;
          } else {
            searchContext = `\n\n[SYSTEM CONTEXT — no manuscripts found in the JESAM repository matching "${term}"]\n`;
          }
        }

        // 4. Build the `contents` array for the Gemini REST API.
        //
        //    GEMINI REST REQUIREMENTS:
        //      a) No empty text parts — drop messages with blank text.
        //      b) Strictly alternating roles: "user" → "model" → "user" …
        //         Consecutive same-role turns are merged by concatenation.
        //      c) The array must start with a "user" turn.
        //
        //    We exclude the welcome message (synthetic UI state) and any
        //    still-streaming placeholder, then convert assistant → "model".

        // Pass 1: filter synthetic / empty messages
        const validMessages = messages.filter(
          (m) => m.id !== "welcome" && !m.isStreaming && m.text.trim() !== ""
        );

        // Pass 2: collapse consecutive same-role turns & map roles
        const contents: GeminiContent[] = [];
        for (const m of validMessages) {
          const geminiRole = m.role === "assistant" ? "model" : "user";
          const last = contents[contents.length - 1];
          if (last && last.role === geminiRole) {
            // Merge into the previous turn to maintain strict alternation.
            last.parts[0].text += "\n" + m.text;
          } else {
            contents.push({ role: geminiRole, parts: [{ text: m.text }] });
          }
        }

        // 5. Append the new user message (with any search context injected).
        //
        //    searchContext is appended to the outgoing message so the model
        //    can reference manuscript results without polluting visible history.
        contents.push({
          role: "user",
          parts: [{ text: userText.trim() + searchContext }],
        });

        // 6. Build the complete request body.
        //
        //    system_instruction is the REST equivalent of the SDK's
        //    `config.systemInstruction`. It is a Content-like object (without
        //    a `role` field) containing the system prompt in `parts`.
        const requestBody: GeminiRequestBody = {
          system_instruction: {
            parts: [{ text: JESAM_SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          },
        };

        // 7. Stream the response and update the assistant message chunk-by-chunk.
        for await (const deltaText of streamGeminiResponse(requestBody, apiKey)) {
          streamBufferRef.current += deltaText;
          const captured = streamBufferRef.current;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, text: captured } : m
            )
          );
        }

        // 8. Finalise: clear isStreaming, attach any manuscript search results.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, isStreaming: false, manuscriptResults }
              : m
          )
        );
      } catch (err) {
        const errorText =
          "Sorry, I encountered an error while processing your request. " +
          "Please try again or contact the editorial office for assistance.";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, text: errorText, isStreaming: false }
              : m
          )
        );

        console.error("[JESAM AI Chatbot] Gemini REST API error:", err);
      } finally {
        setIsLoading(false);
        streamBufferRef.current = "";
      }
    },
    [isLoading, messages]
  );

  // -------------------------------------------------------------------------
  // clearChat — reset to just the welcome message
  // -------------------------------------------------------------------------

  const clearChat = useCallback(() => {
    setMessages([makeWelcome()]);
    setIsLoading(false);
    streamBufferRef.current = "";
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}
