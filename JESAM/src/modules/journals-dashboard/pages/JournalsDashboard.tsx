import { useCallback, useEffect, useMemo, useState } from "react";
import { listPublishedManuscriptsPublic } from "@/lib/manuscripts-db";
import type { Manuscript } from "@/types";
import PublicHeader from "@/components/layout/PublicHeader";
import { Link } from "react-router";

export default function JournalsDashboard() {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<"all" | "Land" | "Air" | "Water" | "People">("all");

  const load = useCallback(async () => {
    setLoadError(null);
    const { data, error } = await listPublishedManuscriptsPublic();
    if (error) {
      setLoadError(error.message);
      setManuscripts([]);
      return;
    }
    setManuscripts(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return manuscripts.filter((m) => {
      const byFocus = focus === "all" || m.classification === focus;
      const byQuery =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.keywords.some((k) => k.toLowerCase().includes(q)) ||
        m.authors.some((a) => a.toLowerCase().includes(q));
      return byFocus && byQuery;
    });
  }, [manuscripts, query, focus]);

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Journals Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Public-facing discovery for published JESAM articles with archive-link strategy.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loadError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 text-sm">
            Could not load articles: {loadError}. If you are browsing without signing in, ensure
            published manuscripts are readable under your Supabase RLS policies.
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, or keywords"
            className="md:col-span-2 border border-gray-300 rounded px-3 py-2"
          />
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value as typeof focus)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">All focus areas</option>
            <option value="Land">Land</option>
            <option value="Air">Air</option>
            <option value="Water">Water</option>
            <option value="People">People</option>
          </select>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Official archive continuity: when older records are unavailable locally, users are directed
            to UPLB/OJS archives.
          </p>
          <a
            href="https://journal.uplb.edu.ph/"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-700 hover:underline"
          >
            Open legacy archive portal
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500">{m.reference_code ?? m.id.slice(0, 8)}</p>
              <h3 className="font-semibold text-gray-900 mt-1">{m.title}</h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{m.abstract}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {m.keywords.slice(0, 4).map((k) => (
                  <span key={k} className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {k}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-600">{m.classification ?? "Unclassified"}</span>
                <Link to={`/article/public/${m.id}`} className="text-sm text-blue-700 hover:underline">
                  Read article
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-500">
              No published articles match the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
