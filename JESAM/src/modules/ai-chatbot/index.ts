/**
 * src/modules/ai-chatbot/index.ts
 *
 * Public barrel export for the AI Chatbot module.
 *
 * Other modules (e.g. the router) import from here rather than from deep
 * internal paths.  This means internal restructuring doesn't break imports.
 */

export { default as AIChatbotPage } from "./pages/AIChatbotPage";

// Expose types that other modules might legitimately need
// (e.g. if a parent page wants to embed the chatbot in a panel)
export type { ChatMessage, FaqShortcut } from "./types";
