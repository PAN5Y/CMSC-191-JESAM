import { useCallback, useEffect, useMemo, useState } from "react";
import { listPublishedManuscriptsPublic } from "@/lib/manuscripts-db";
import type { Manuscript } from "@/types";
import { Link } from "react-router";
import { Search, ExternalLink, Sparkles, ChevronRight } from "lucide-react";
import { answerWorkflowQuestion } from "@/lib/workflow-assistant";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

/* ── Subject pills (Figma palette) ── */
const SUBJECTS = [
  { label: "Land systems",      key: "Land",   bg: "bg-[#d4edda]", text: "text-[#1e5631]",   border: "border-[#a3cfa8]" },
  { label: "Water quality",     key: "Water",  bg: "bg-[#cce5f6]", text: "text-[#1a4e72]",   border: "border-[#8ec7e8]" },
  { label: "Climate and air",   key: "Air",    bg: "bg-[#d1ede8]", text: "text-[#1a4a3e]",   border: "border-[#8acec2]" },
  { label: "Biodiversity",      key: "Land",   bg: "bg-[#eef2d4]", text: "text-[#3d4f0d]",   border: "border-[#c5ce8a]" },
  { label: "Policy and people", key: "People", bg: "bg-[#dde0ef]", text: "text-[#2b3060]",   border: "border-[#9ba3cc]" },
  { label: "AI and remote sensing", key: "all", bg: "bg-[#f7f0cc]", text: "text-[#5a4a00]",  border: "border-[#d4c050]" },
  { label: "Sustainable cities", key: "People", bg: "bg-white",   text: "text-[#3f4b7e]",   border: "border-[#3f4b7e]" },
  { label: "Forest ecology",    key: "Land",   bg: "bg-[#eeeeee]", text: "text-[#424242]",   border: "border-[#bdbdbd]" },
];

export default function JournalsDashboard() {
  const { user } = useAuth();
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeSubject, setActiveSubject] = useState<string>("all");

  /* AI assistant */
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    const { data, error } = await listPublishedManuscriptsPublic();
    if (error) { setLoadError(error.message); setManuscripts([]); }
    else        { setManuscripts(data); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return manuscripts.filter((m) => {
      const subjectMatch = activeSubject === "all" ||
        m.classification === activeSubject ||
        m.keywords.some((k) => k.toLowerCase().includes(activeSubject.toLowerCase()));
      const queryMatch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.keywords.some((k) => k.toLowerCase().includes(q)) ||
        m.authors.some((a) => a.toLowerCase().includes(q));
      return subjectMatch && queryMatch;
    });
  }, [manuscripts, query, activeSubject]);

  /* Metrics */
  const totalDownloads  = manuscripts.reduce((s, m) => s + (m.metrics?.downloads ?? 0), 0);
  const totalCitations  = manuscripts.reduce((s, m) => s + (m.metrics?.citations  ?? 0), 0);
  const withPdf         = manuscripts.filter((m) => !!m.file_url).length;

  const metrics = [
    { value: manuscripts.length,             label: "Published articles",   bg: "bg-white",        border: "border-gray-200" },
    { value: withPdf,                         label: "Downloadable",         bg: "bg-[#f0fdf4]",    border: "border-[#bbf7d0]" },
    { value: totalDownloads > 1000 ? `${(totalDownloads / 1000).toFixed(1)}k` : totalDownloads, label: "Monthly downloads", bg: "bg-[#f0f9ff]", border: "border-[#bae6fd]" },
    { value: totalCitations > 1000 ? `${(totalCitations / 1000).toFixed(1)}k` : totalCitations || "1,284", label: "Citations tracked", bg: "bg-[#fffbeb]", border: "border-[#fde68a]" },
  ];

  const handleAskAI = () => {
    if (!aiQuery.trim()) return;
    setAiAnswer(answerWorkflowQuestion(aiQuery));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-['Public_Sans',sans-serif] flex">
      {/* Sidebar for all users (guests included) */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 py-10">

        {/* ── Two-column hero layout ── */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">

          {/* Left: hero + search + metrics + recent pubs */}
          <div className="flex-1 min-w-0">

            {/* Hero text */}
            <p className="text-xs font-bold uppercase tracking-widest text-[#3f4b7e] mb-3">
              Public Journal Dashboard
            </p>
            <h1 className="font-['Newsreader',serif] text-[44px] leading-[1.1] text-gray-900 mb-3">
              Find published JESAM journals and articles.
            </h1>
            <p className="text-gray-500 text-[15px] mb-6 max-w-xl">
              Public discovery portal for finalized research outputs. Browse by journal, subject,
              year, volume, issue, or search topics such as explainable AI.
            </p>

            {/* Search row */}
            <div className="flex gap-2 mb-8">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                  Search
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search titles, authors, keywords, topics, or subject areas"
                  className="w-full pl-16 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3f4b7e]/30 focus:border-[#3f4b7e]"
                />
              </div>
              <button
                onClick={load}
                className="px-5 py-3 bg-[#3f4b7e] text-white text-sm font-semibold rounded-lg hover:bg-[#3f4b7e]/90 transition-colors whitespace-nowrap"
              >
                Search library
              </button>
              <a
                href="https://journal.uplb.edu.ph/"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 bg-white border border-gray-300 text-sm text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                OVCRE site
              </a>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {metrics.map(({ value, label, bg, border }) => (
                <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Journals / Issues */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-semibold text-gray-900">Browse by Journal Issue</h2>
                <button className="text-xs text-[#3f4b7e] font-medium hover:underline">View all issues</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { vol: "Vol. 27 No. 1", year: "2024", color: "bg-white", border: "border-[#3f4b7e]/20" },
                  { vol: "Vol. 26 No. 2", year: "2023", color: "bg-white", border: "border-gray-200" },
                  { vol: "Vol. 26 No. 1", year: "2023", color: "bg-white", border: "border-gray-200" },
                ].map((issue, i) => (
                  <button key={i} onClick={() => setQuery(issue.vol)} className="group block text-left">
                    <div className={`${issue.color} aspect-[3/4] rounded-lg border ${issue.border} mb-3 p-5 flex flex-col justify-between group-hover:shadow-md group-hover:border-[#3f4b7e]/40 transition-all relative overflow-hidden`}>
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#3f4b7e] opacity-90" />
                      <div className="font-['Newsreader',serif] text-[#3f4b7e] text-xl leading-tight mt-2 opacity-80">JESAM</div>
                      <div>
                        <div className="text-[15px] font-bold text-gray-900 mb-0.5">{issue.vol}</div>
                        <div className="text-xs text-gray-500 font-medium">Published {issue.year}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent publications */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold text-gray-900">Recent publications</h2>
              {query && (
                <span className="text-xs px-2.5 py-1 bg-[#eff6ff] text-[#1e40af] rounded-md font-medium">
                  Showing results for "{query}"
                </span>
              )}
            </div>

            {loadError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm mb-4">
                Could not load articles: {loadError}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-4 bg-gray-100 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                {query ? `No articles match "${query}"` : "No published articles yet."}
                {query && (
                  <button onClick={() => setQuery("")} className="ml-2 text-[#3f4b7e] hover:underline">
                    Clear
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.slice(0, 8).map((m) => {
                  const hasPdf = !!m.file_url;
                  return (
                    <article
                      key={m.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 hover:shadow-sm transition-shadow"
                    >
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-['Newsreader',serif] text-[16px] text-gray-900 leading-snug mb-1">
                          {m.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {m.authors[0] ?? "—"}
                          {m.reference_code ? ` · ${m.reference_code}` : ""}
                          {m.published_at
                            ? ` · ${new Date(m.published_at).getFullYear()}`
                            : ""}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {m.abstract}
                        </p>
                      </div>

                      {/* Right: badge + actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${
                            hasPdf
                              ? "bg-[#d4edda] text-[#1e5631]"
                              : "bg-[#fde8e8] text-[#9b1c1c]"
                          }`}
                        >
                          {hasPdf ? "PDF available" : "Reader only"}
                        </span>
                        <Link
                          to={`/article/public/${m.id}`}
                          className="px-4 py-1.5 bg-[#3f4b7e] text-white text-xs font-semibold rounded-lg hover:bg-[#3f4b7e]/90 transition-colors"
                        >
                          Open article
                        </Link>
                        {!hasPdf && (
                          <button className="px-4 py-1.5 bg-white border border-gray-200 text-xs text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
                            Metadata only
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: AI discovery card + Browse by subject */}
          <div className="w-full lg:w-[340px] shrink-0 space-y-4">

            {/* AI-assisted discovery card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-5 text-[#3f4b7e]" />
                <h2 className="font-['Newsreader',serif] text-[18px] text-gray-900">
                  AI-assisted discovery
                </h2>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Ask for summaries, related publications, or topic recommendations across public
                metadata and permitted full-text content.
              </p>

              {/* Tag pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: "Summaries",    color: "bg-[#d4edda] text-[#1e5631]"  },
                  { label: "Related work", color: "bg-[#f7f0cc] text-[#5a4a00]"  },
                  { label: "Topic search", color: "bg-[#fde8e8] text-[#9b1c1c]"  },
                ].map(({ label, color }) => (
                  <span key={label} className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>
                    {label}
                  </span>
                ))}
              </div>

              {/* AI search */}
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Search</span>
                  <input
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAskAI(); }}
                    placeholder="Ask about coastal water quality…"
                    className="w-full pl-14 pr-3 py-2.5 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3f4b7e]/20 focus:border-[#3f4b7e]"
                  />
                </div>
                <button
                  onClick={handleAskAI}
                  className="px-4 py-2.5 bg-[#3f4b7e] text-white text-xs font-semibold rounded-lg hover:bg-[#3f4b7e]/90 transition-colors"
                >
                  Ask AI
                </button>
              </div>
              {aiAnswer && (
                <p className="text-xs text-gray-700 bg-[#f5f7ff] border border-[#e8eaf6] rounded-lg p-3 leading-relaxed">
                  {aiAnswer}
                </p>
              )}
            </div>

            {/* Browse by subject card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-['Newsreader',serif] text-[18px] text-gray-900 mb-4">
                Browse by subject
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setActiveSubject(activeSubject === s.key ? "all" : s.key)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all truncate ${
                      activeSubject === s.key
                        ? `${s.bg} ${s.text} ${s.border} ring-2 ring-offset-1 ring-[#3f4b7e]/30`
                        : `${s.bg} ${s.text} ${s.border} hover:opacity-80`
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-200">
          Public access only: metadata is visible for all published items. Downloads are shown only
          when author permission is available.{" "}
          <a
            href="https://journal.uplb.edu.ph/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#3f4b7e] hover:underline"
          >
            Legacy archive <ExternalLink className="size-3" />
          </a>
        </p>
      </div>
      </div>
    </div>
  );
}
