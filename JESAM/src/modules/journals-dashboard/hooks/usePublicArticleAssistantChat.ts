import { useCallback, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { JESAM_SYSTEM_PROMPT } from "@/modules/ai-chatbot/lib/chatbot-config";
import type { PublicArticleSearchResult } from "../types";
import {
  filterPublicArticleSearchResults,
  comparePublicArticleSearchResults,
} from "../queries/publicSearchResultMatchers";
import {
  mapRowsToPublicArticleSearchResults,
  type PublicSearchResultRow,
} from "../queries/publicSearchResultMappers";

const MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 1024;
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const STREAM_URL = `${GEMINI_BASE_URL}/${MODEL}:streamGenerateContent`;

const SEARCH_TRIGGERS = [
  /\bfind\b.*\bpaper/i,
  /\bsearch\b.*\b(paper|article|literature|study|studies)/i,
  /\brelated\b.*\b(paper|article|literature)/i,
  /\b(paper|article)s?\b.*\b(on|about|regarding|related to)\b/i,
  /\bliterature\b.*\bon\b/i,
  /\bshow me\b.*\bpaper/i,
  /\bany\b.*\b(paper|article)s?\b.*\bon\b/i,
];

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
  }>;
}

export interface PublicArticleAssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  isStreaming?: boolean;
  relatedResults?: PublicArticleSearchResult[];
}

interface UsePublicArticleAssistantChatOptions {
  articleId: string;
  contextualPrompt: string;
  welcomeMessage: string;
}

function makeWelcome(text: string): PublicArticleAssistantMessage {
  return {
    id: "welcome",
    role: "assistant",
    text,
    createdAt: new Date().toISOString(),
  };
}

function hasSearchIntent(message: string) {
  return SEARCH_TRIGGERS.some((re) => re.test(message));
}

function extractSearchTerm(message: string) {
  const stripped = message
    .replace(/^(find|search for?|look for?|show me|are there any|do you have|get me)\s+/i, "")
    .replace(/\b(papers?|articles?|studies|literature)\b/gi, "")
    .replace(/\b(on|about|regarding|related to|concerning)\b/gi, "")
    .replace(/\bin (the\s+)?(jesam\s+)?(archive|journal|repository)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return stripped.length > 2 ? stripped : message.trim();
}

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
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error("Gemini API returned an empty body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice("data: ".length).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const chunk = JSON.parse(jsonStr) as GeminiStreamChunk;
          const deltaText =
            chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

          if (deltaText) {
            yield deltaText;
          }
        } catch {
          // Ignore malformed stream chunks.
        }
      }
    }
  }

  for (const line of buffer.split("\n")) {
    if (!line.startsWith("data: ")) continue;

    const jsonStr = line.slice("data: ".length).trim();
    if (!jsonStr || jsonStr === "[DONE]") continue;

    try {
      const chunk = JSON.parse(jsonStr) as GeminiStreamChunk;
      const deltaText =
        chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (deltaText) {
        yield deltaText;
      }
    } catch {
      // Ignore malformed stream chunks.
    }
  }
}

async function searchPublicRelatedArticles(
  query: string,
  currentArticleId: string
) {
  const { data, error } = await supabase
    .from("public_journal_article_details")
    .select(
      "journal_id, journal_title, id, title, authors, abstract, classification, published_at, issue_assignment"
    )
    .order("published_at", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    return [];
  }

  const mappedResults = mapRowsToPublicArticleSearchResults(
    (data ?? []) as PublicSearchResultRow[]
  ).sort(comparePublicArticleSearchResults);

  return filterPublicArticleSearchResults(mappedResults, query)
    .filter((result) => result.articleId !== currentArticleId)
    .slice(0, 5);
}

export function usePublicArticleAssistantChat({
  articleId,
  contextualPrompt,
  welcomeMessage,
}: UsePublicArticleAssistantChatOptions) {
  const [messages, setMessages] = useState<PublicArticleAssistantMessage[]>([
    makeWelcome(welcomeMessage),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const streamBufferRef = useRef("");

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isLoading) return;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

      if (!apiKey) {
        return;
      }

      const userMsg: PublicArticleAssistantMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: userText.trim(),
        createdAt: new Date().toISOString(),
      };

      const assistantId = `a-${Date.now()}`;
      const assistantPlaceholder: PublicArticleAssistantMessage = {
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
        let relatedResults: PublicArticleSearchResult[] | undefined;
        let searchContext = "";

        if (hasSearchIntent(userText)) {
          const term = extractSearchTerm(userText);
          const results = await searchPublicRelatedArticles(term, articleId);

          if (results.length > 0) {
            relatedResults = results;
            searchContext = `\n\n[PUBLIC JESAM SEARCH RESULTS FOR "${term}"]\n`;
            searchContext += `Found ${results.length} result(s):\n`;
            results.forEach((result, index) => {
              searchContext += `${index + 1}. "${result.title}" — ${result.journalTitle}${
                result.classification ? ` — ${result.classification}` : ""
              }\n`;
            });
            searchContext += "[END PUBLIC JESAM SEARCH RESULTS]\n";
          } else {
            searchContext = `\n\n[PUBLIC JESAM SEARCH RESULTS]\nNo related public JESAM papers were found for "${term}".\n[END PUBLIC JESAM SEARCH RESULTS]\n`;
          }
        }

        const validMessages = messages.filter(
          (message) =>
            message.id !== "welcome" &&
            !message.isStreaming &&
            message.text.trim() !== ""
        );

        const contents: GeminiContent[] = [];

        for (const message of validMessages) {
          const geminiRole = message.role === "assistant" ? "model" : "user";
          const last = contents[contents.length - 1];

          if (last && last.role === geminiRole) {
            last.parts[0].text += `\n${message.text}`;
          } else {
            contents.push({ role: geminiRole, parts: [{ text: message.text }] });
          }
        }

        contents.push({
          role: "user",
          parts: [
            {
              text:
                userText.trim() +
                `\n\n[PUBLIC ARTICLE CONTEXT]\n${contextualPrompt}\n[END PUBLIC ARTICLE CONTEXT]\n` +
                searchContext,
            },
          ],
        });

        const requestBody: GeminiRequestBody = {
          system_instruction: {
            parts: [{ text: JESAM_SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          },
        };

        for await (const deltaText of streamGeminiResponse(requestBody, apiKey)) {
          streamBufferRef.current += deltaText;
          const captured = streamBufferRef.current;

          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, text: captured }
                : message
            )
          );
        }

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, isStreaming: false, relatedResults }
              : message
          )
        );
      } catch (error) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  text: "The article assistant is temporarily unavailable. Please try again in a moment.",
                  isStreaming: false,
                }
              : message
          )
        );

        console.error("[JESAM Article Assistant]", error);
      } finally {
        setIsLoading(false);
        streamBufferRef.current = "";
      }
    },
    [articleId, contextualPrompt, isLoading, messages]
  );

  const clearChat = useCallback(() => {
    setMessages([makeWelcome(welcomeMessage)]);
    setIsLoading(false);
    streamBufferRef.current = "";
  }, [welcomeMessage]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
}
