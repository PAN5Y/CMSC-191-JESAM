import { useMemo, useState } from "react";
import { CHATBOT_FAQ, answerWorkflowQuestion } from "@/lib/workflow-assistant";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export default function AIChatbotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      role: "assistant",
      text: "Hello. I am the JESAM assistive chatbot for workflow and formatting FAQs.",
    },
  ]);

  const faqButtons = useMemo(() => CHATBOT_FAQ.slice(0, 3), []);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text };
    const botMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: answerWorkflowQuestion(text),
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Chatbot (Assistive)</h1>
          <p className="text-gray-600 mt-1">
            FAQ and workflow guidance only. Final editorial decisions remain human-controlled.
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          This assistant is intentionally non-authoritative: it provides guidance, not final decisions.
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 mb-3">Quick questions</p>
          <div className="flex flex-wrap gap-2">
            {faqButtons.map((f) => (
              <button
                key={f.q}
                type="button"
                onClick={() => send(f.q)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                {f.q}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 h-[420px] overflow-y-auto space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`p-3 rounded ${m.role === "assistant" ? "bg-blue-50" : "bg-gray-100"}`}>
              <p className="text-xs uppercase text-gray-500">{m.role}</p>
              <p className="text-sm text-gray-900 mt-1">{m.text}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(input);
            }}
            placeholder="Ask about submission, peer review, revision, DOI, or publication workflow"
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
          <button type="button" onClick={() => send(input)} className="px-4 py-2 bg-gray-900 text-white rounded">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
