import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import {
  Download,
  Calendar,
  Tag,
  Users as UsersIcon,
  Globe,
  FileText,
  ChevronLeft,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Manuscript } from "../types";
import { CHATBOT_FAQ, answerWorkflowQuestion } from "@/lib/workflow-assistant";

type RelatedRow = Pick<Manuscript, "id" | "title" | "reference_code" | "classification">;

function PublicReaderAssistant({ aiSummary }: { aiSummary: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ id: string; role: "user" | "assistant"; text: string }[]>(
    [
      {
        id: "welcome",
        role: "assistant",
        text: "Ask about JESAM workflows (submission, peer review, revision). Editorial decisions stay with humans.",
      },
    ]
  );

  const send = (text: string) => {
    if (!text.trim()) return;
    const ts = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: `u-${ts}`, role: "user", text },
      { id: `a-${ts}`, role: "assistant", text: answerWorkflowQuestion(text) },
    ]);
    setInput("");
  };

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-5">
        <h2 className="font-['Newsreader',serif] text-[18px] text-[#1a1c1c] mb-2">AI assistive summary</h2>
        <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif] mb-3">
          Assistive-only interpretation (proposal: split view with summary + assistant).
        </p>
        <p className="text-sm text-[#374151] font-['Public_Sans',sans-serif] leading-relaxed">{aiSummary}</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-5">
        <h3 className="font-semibold text-[#1a1c1c] mb-2 font-['Public_Sans',sans-serif]">
          Workflow assistant (chatbot)
        </h3>
        <p className="text-xs text-[#6b7280] mb-3">Same FAQ logic as the editorial AI chatbot.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {CHATBOT_FAQ.slice(0, 3).map((f) => (
            <button
              key={f.q}
              type="button"
              onClick={() => send(f.q)}
              className="text-xs px-2 py-1.5 bg-[#f5f5f5] hover:bg-gray-200 rounded border border-[#e0e0e0] text-left max-w-full"
            >
              {f.q.length > 52 ? `${f.q.slice(0, 52)}…` : f.q}
            </button>
          ))}
        </div>
        <div className="max-h-52 overflow-y-auto space-y-2 mb-3 border border-gray-100 rounded p-2 bg-[#fafafa]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`text-sm p-2 rounded ${msg.role === "assistant" ? "bg-blue-50" : "bg-gray-100"}`}
            >
              <span className="text-[10px] uppercase text-gray-500">{msg.role}</span>
              <p className="text-[#1a1c1c] mt-0.5">{msg.text}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(input);
            }}
            placeholder="e.g. formatting, ORCID…"
            className="flex-1 border border-[#e0e0e0] rounded px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => send(input)}
            className="px-4 py-2 bg-[#3f4b7e] text-white rounded text-sm hover:bg-[#3f4b7e]/90"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [related, setRelated] = useState<RelatedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      if (!id) return;
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from("manuscripts")
        .select("*, metrics:article_metrics(*)")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError("Article not found");
      } else {
        setManuscript({
          ...data,
          metrics: Array.isArray(data.metrics)
            ? data.metrics[0] || null
            : data.metrics,
        } as Manuscript);
      }
      setLoading(false);
    }

    fetchArticle();
  }, [id]);

  useEffect(() => {
    async function fetchRelated() {
      if (!manuscript?.id) return;
      let q = supabase
        .from("manuscripts")
        .select("id,title,reference_code,classification")
        .eq("status", "Published")
        .neq("id", manuscript.id)
        .limit(8);
      if (manuscript.classification) {
        q = q.eq("classification", manuscript.classification);
      }
      const { data } = await q;
      const rows = (data ?? []) as RelatedRow[];
      if (rows.length < 3 && manuscript.classification) {
        const { data: fallback } = await supabase
          .from("manuscripts")
          .select("id,title,reference_code,classification")
          .eq("status", "Published")
          .neq("id", manuscript.id)
          .limit(8);
        const extra = (fallback ?? []) as RelatedRow[];
        const seen = new Set(rows.map((r) => r.id));
        for (const r of extra) {
          if (!seen.has(r.id)) {
            rows.push(r);
            seen.add(r.id);
          }
          if (rows.length >= 6) break;
        }
      }
      setRelated(rows.slice(0, 6));
    }
    void fetchRelated();
  }, [manuscript?.id, manuscript?.classification]);

  const handleDownload = async () => {
    if (!manuscript?.file_url || !id) return;

    const { data: current } = await supabase
      .from("article_metrics")
      .select("downloads")
      .eq("manuscript_id", id)
      .single();

    if (current) {
      await supabase
        .from("article_metrics")
        .update({ downloads: (current.downloads || 0) + 1 })
        .eq("manuscript_id", id);
    }

    window.open(manuscript.file_url, "_blank");
  };

  const aiSummary =
    manuscript?.submission_metadata?.ai_summary?.short ??
    (manuscript
      ? `This article discusses ${manuscript.classification ?? "environmental"} research with focus on ${
          manuscript.keywords.slice(0, 3).join(", ") || "key JESAM themes"
        }. This assistive summary is generated for reader orientation and is not a replacement for full peer-reviewed content.`
      : "");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="size-8 border-3 border-[#3f4b7e]/20 border-t-[#3f4b7e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
            Loading article...
          </p>
        </div>
      </div>
    );
  }

  if (error || !manuscript) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText className="size-16 text-[#9e9e9e] mx-auto mb-4" />
          <h1 className="font-['Newsreader',serif] text-[28px] text-[#1a1c1c] mb-2">
            Article Not Found
          </h1>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
            The article you&apos;re looking for does not exist or may have been removed.
          </p>
          <Link to="/browse" className="inline-block mt-4 text-sm text-[#3f4b7e] hover:underline">
            Back to journals browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#3f4b7e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <Link
            to="/browse"
            className="inline-flex items-center gap-1 text-sm text-white/85 hover:text-white mb-4 font-['Public_Sans',sans-serif]"
          >
            <ChevronLeft className="size-4" />
            Journals browse
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="size-5 text-[#F5C344]" />
            <span className="text-xs text-white/60 uppercase tracking-wider font-['Public_Sans',sans-serif]">
              Journal of Environmental Science and Management
            </span>
          </div>
          <h1 className="font-['Newsreader',serif] text-[28px] md:text-[32px] leading-[40px]">
            {manuscript.title}
          </h1>
          <p className="text-white/70 font-['Newsreader',serif] italic text-[17px] md:text-[18px] mt-2">
            {manuscript.authors.join(", ")}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:gap-10 lg:items-start">
          <div className="flex-1 min-w-0 lg:max-w-[58%] space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {manuscript.doi && (
                  <div className="flex items-start gap-2">
                    <Tag className="size-4 text-[#3f4b7e] mt-0.5" />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-['Public_Sans',sans-serif]">
                        DOI
                      </div>
                      <a
                        href={`https://doi.org/${manuscript.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#3f4b7e] font-['Public_Sans',sans-serif] hover:underline"
                      >
                        {manuscript.doi}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Calendar className="size-4 text-[#3f4b7e] mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-['Public_Sans',sans-serif]">
                      Published
                    </div>
                    <div className="text-sm text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                      {manuscript.published_at
                        ? new Date(manuscript.published_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Pending"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UsersIcon className="size-4 text-[#3f4b7e] mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-['Public_Sans',sans-serif]">
                      Classification
                    </div>
                    <div className="text-sm text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                      {manuscript.classification ?? "—"}
                    </div>
                  </div>
                </div>
                {manuscript.metrics && (
                  <div className="flex items-start gap-2">
                    <Download className="size-4 text-[#3f4b7e] mt-0.5" />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-['Public_Sans',sans-serif]">
                        Downloads
                      </div>
                      <div className="text-sm text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                        {manuscript.metrics.downloads.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-6">
              <h2 className="font-['Newsreader',serif] text-[20px] text-[#1a1c1c] mb-4">
                Abstract
              </h2>
              <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] leading-relaxed">
                {manuscript.abstract}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-6">
              <h2 className="font-['Newsreader',serif] text-[20px] text-[#1a1c1c] mb-4">
                Keywords
              </h2>
              <div className="flex flex-wrap gap-2">
                {manuscript.keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-[#f5f5f5] text-sm text-[#1a1c1c] font-['Public_Sans',sans-serif] rounded-full border border-[#e0e0e0]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {related.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="size-5 text-[#3f4b7e]" />
                  <h2 className="font-['Newsreader',serif] text-[20px] text-[#1a1c1c]">
                    Connected papers (JESAM)
                  </h2>
                </div>
                <p className="text-xs text-[#6b7280] mb-4 font-['Public_Sans',sans-serif]">
                  Linked publications—same focus area first, then broader corpus.
                </p>
                <ul className="space-y-3">
                  {related.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/article/public/${r.id}`}
                        className="text-sm text-[#3f4b7e] hover:underline font-medium font-['Public_Sans',sans-serif]"
                      >
                        {r.title}
                      </Link>
                      <p className="text-xs text-[#9e9e9e] mt-0.5">
                        {r.reference_code ?? r.id.slice(0, 8)}
                        {r.classification ? ` · ${r.classification}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {manuscript.file_url && (
              <div className="bg-gradient-to-r from-[#3f4b7e] to-[#5a67a3] rounded-lg shadow-lg p-8 text-center">
                <Download className="size-12 text-white/40 mx-auto mb-4" />
                <h3 className="font-['Newsreader',serif] text-[24px] text-white mb-2">
                  Full Article (PDF)
                </h3>
                <p className="text-white/70 font-['Public_Sans',sans-serif] text-sm mb-6">
                  Download the complete article in PDF format
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-8 py-3 bg-[#F5C344] text-[#3f4b7e] font-['Public_Sans',sans-serif] font-medium rounded-lg hover:bg-[#F5C344]/90 transition-all hover:scale-105 shadow-lg"
                >
                  Download PDF
                </button>
              </div>
            )}

            <footer className="text-center text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif] pt-4">
              <p>
                © {new Date().getFullYear()} Journal of Environmental Science and Management
              </p>
              <p>
                University of the Philippines Los Baños · School of Environmental Science and
                Management
              </p>
            </footer>
          </div>

          <aside className="w-full lg:w-[38%] lg:max-w-md mt-8 lg:mt-0 lg:sticky lg:top-6 shrink-0 space-y-6 self-start">
            <PublicReaderAssistant aiSummary={aiSummary} />
          </aside>
        </div>
      </main>
    </div>
  );
}
