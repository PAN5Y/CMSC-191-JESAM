import { useMemo, useState } from "react";
import { BarChart3, BookOpen, Tag } from "lucide-react";
import { useManuscripts } from "../hooks/useManuscripts";
import ManuscriptCard from "../components/ManuscriptCard";
import type { ManuscriptStatus } from "../types";

const statusTabs: {
  label: string;
  value: ManuscriptStatus | "all" | "terminal";
}[] = [
  { label: "All", value: "all" },
  { label: "In Layout", value: "In Layout" },
  { label: "Proofreading", value: "Proofreading" },
  { label: "Author Review", value: "Author Galley Review" },
  { label: "Scheduled", value: "Scheduled for Publication" },
  { label: "Issue Mgmt", value: "In Issue Management" },
  { label: "Published", value: "Published" },
  { label: "Archived / Declined", value: "terminal" },
];

function topEntries(values: string[], limit = 5) {
  const counts = new Map<string, number>();
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

export default function PublicationDashboard() {
  const {
    manuscripts,
    loading,
    error,
    fetchManuscripts,
    transitionStatus,
    completeLayout,
    proofreadingDecision,
    latestGalleys,
    fetchGalleyVersionsForManuscript,
  } = useManuscripts({ publicationOnly: true });
  const [activeTab, setActiveTab] = useState<
    ManuscriptStatus | "all" | "terminal"
  >("all");

  const filteredManuscripts =
    activeTab === "all"
      ? manuscripts
      : activeTab === "terminal"
        ? manuscripts.filter(
            (m) => m.status === "Archived" || m.status === "Declined",
          )
        : manuscripts.filter((m) => m.status === activeTab);

  /* ── Stage counts for the summary bar ── */
  const counts: Record<string, number> = {};
  for (const tab of statusTabs) {
    if (tab.value === "all") {
      counts["all"] = manuscripts.length;
    } else if (tab.value === "terminal") {
      counts["terminal"] = manuscripts.filter(
        (m) => m.status === "Archived" || m.status === "Declined",
      ).length;
    } else {
      counts[tab.value] = manuscripts.filter(
        (m) => m.status === tab.value,
      ).length;
    }
  }

  const dashboard = useMemo(() => {
    const accepted = manuscripts.filter((m) => m.status === "Accepted");
    const inProduction = manuscripts.filter(
      (m) => m.status === "In Production",
    );
    const published = manuscripts.filter((m) => m.status === "Published");
    const needsDoi = manuscripts.filter(
      (m) => !m.doi && m.status !== "Published",
    );
    const needsFile = manuscripts.filter((m) => !m.file_url);
    const readyToPublish = manuscripts.filter(
      (m) =>
        m.title &&
        m.authors.length > 0 &&
        m.keywords.length > 0 &&
        m.file_url &&
        m.doi,
    );
    const impactTotals = published.reduce(
      (acc, m) => {
        acc.views += m.metrics?.views ?? 0;
        acc.downloads += m.metrics?.downloads ?? 0;
        acc.citations += m.metrics?.citations ?? 0;
        return acc;
      },
      { views: 0, downloads: 0, citations: 0 },
    );
    const topPublished = [...published]
      .sort(
        (a, b) =>
          ((b.metrics?.views ?? 0) + (b.metrics?.downloads ?? 0) + (b.metrics?.citations ?? 0) * 5) -
          ((a.metrics?.views ?? 0) + (a.metrics?.downloads ?? 0) + (a.metrics?.citations ?? 0) * 5),
      )
      .slice(0, 4);
    const keywordStats = topEntries(manuscripts.flatMap((m) => m.keywords), 6);
    const needsDiscoverability = manuscripts.filter(
      (m) => m.keywords.length < 3 || !m.doi || !m.file_url || !m.issue_assignment,
    );
    return {
      accepted,
      inProduction,
      published,
      needsDoi,
      needsFile,
      readyToPublish,
      impactTotals,
      topPublished,
      keywordStats,
      needsDiscoverability,
    };
  }, [manuscripts]);

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-[#e0e0e0]">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-['Newsreader',serif] text-[24px] text-[#3f4b7e] mb-1">
                Publication &amp; Impact Module
              </h2>
              <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
                Manage the post-editing workflow — Layout, Proofreading, Galley
                Review, Issue Management &amp; Publication
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
                  {manuscripts.length} manuscript
                  {manuscripts.length !== 1 && "s"}
                </div>
                <div className="text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
                  Last updated:{" "}
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-8 pb-32">
        {/* Stage summary counters */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
          {statusTabs.map((tab) => {
            const count = counts[tab.value] ?? 0;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all text-center ${
                  isActive
                    ? "bg-[#3f4b7e] text-white border-[#3f4b7e]"
                    : "bg-white text-[#6b7280] border-[#e0e0e0] hover:border-[#3f4b7e]"
                }`}
              >
                <span className="text-xl font-semibold font-['Public_Sans',sans-serif]">
                  {count}
                </span>
                <span className="text-[10px] font-['Public_Sans',sans-serif] leading-tight mt-1">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-[#e0e0e0] p-5 xl:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-['Newsreader',serif] text-[20px] text-[#1a1c1c]">
                  Publication knowledge signals
                </h3>
                <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mt-1">
                  Production-facing cues for discoverability, issue planning, and JESAM impact reporting.
                </p>
              </div>
              <BookOpen className="size-5 text-[#3f4b7e] shrink-0" />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#e0e0e0] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="size-4 text-[#3f4b7e]" />
                  <p className="text-sm font-medium text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                    Production keywords
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dashboard.keywordStats.map(([keyword, count]) => (
                    <span key={keyword} className="rounded-full bg-[#f5f5f5] border border-[#e0e0e0] px-3 py-1 text-xs text-[#1a1c1c]">
                      {keyword} ({count})
                    </span>
                  ))}
                  {dashboard.keywordStats.length === 0 && (
                    <p className="text-sm text-[#6b7280]">No keyword signals yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-[#e0e0e0] p-4">
                <p className="text-sm font-medium text-[#1a1c1c] font-['Public_Sans',sans-serif] mb-3">
                  Discoverability blockers
                </p>
                <div className="space-y-2 text-sm font-['Public_Sans',sans-serif]">
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Needs DOI</span>
                    <span className="font-semibold text-[#1a1c1c]">{dashboard.needsDoi.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Needs file</span>
                    <span className="font-semibold text-[#1a1c1c]">{dashboard.needsFile.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Needs issue/indexing polish</span>
                    <span className="font-semibold text-[#1a1c1c]">{dashboard.needsDiscoverability.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Ready to publish</span>
                    <span className="font-semibold text-[#1a1c1c]">{dashboard.readyToPublish.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#e0e0e0] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-['Newsreader',serif] text-[20px] text-[#1a1c1c]">
                  Published impact
                </h3>
                <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mt-1">
                  Signals useful for promotion and public visibility.
                </p>
              </div>
              <BarChart3 className="size-5 text-[#3f4b7e] shrink-0" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ["Views", dashboard.impactTotals.views],
                ["Downloads", dashboard.impactTotals.downloads],
                ["Citations", dashboard.impactTotals.citations],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#e0e0e0] p-3 text-center">
                  <p className="text-lg font-semibold text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                    {value}
                  </p>
                  <p className="text-[11px] text-[#6b7280] font-['Public_Sans',sans-serif]">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {dashboard.topPublished.map((m) => (
                <div key={m.id} className="rounded-lg border border-[#e0e0e0] p-3">
                  <p className="text-sm font-medium text-[#1a1c1c] line-clamp-1 font-['Public_Sans',sans-serif]">
                    {m.title}
                  </p>
                  <p className="text-xs text-[#6b7280] mt-1 font-['Public_Sans',sans-serif]">
                    {(m.metrics?.views ?? 0).toLocaleString()} views · {(m.metrics?.downloads ?? 0).toLocaleString()} downloads · {(m.metrics?.citations ?? 0).toLocaleString()} citations
                  </p>
                </div>
              ))}
              {dashboard.topPublished.length === 0 && (
                <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
                  Published article rankings will appear once metrics exist.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Section title */}
        <div className="mb-6">
          <h2 className="font-['Newsreader',serif] text-[24px] text-[#1a1c1c] mb-2">
            {activeTab === "all"
              ? "All Manuscripts"
              : activeTab === "terminal"
                ? "Archived / Declined"
                : activeTab}
          </h2>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
            Select a manuscript to manage its publication workflow
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="size-8 border-3 border-[#3f4b7e]/20 border-t-[#3f4b7e] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
                Loading manuscripts from database...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-[#ffebee] border border-[#c62828] rounded-lg p-6 text-center">
            <p className="text-sm text-[#c62828] font-['Public_Sans',sans-serif] mb-3">
              Failed to load manuscripts: {error}
            </p>
            <button
              onClick={fetchManuscripts}
              className="px-4 py-2 bg-[#c62828] text-white rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#c62828]/90 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Manuscript Cards */}
        {!loading && !error && (
          <>
            <div className="grid gap-6">
              {filteredManuscripts.map((manuscript) => (
                <ManuscriptCard
                  key={manuscript.id}
                  manuscript={manuscript}
                  latestGalley={latestGalleys.get(manuscript.id) ?? null}
                  onTransition={transitionStatus}
                  onCompleteLayout={completeLayout}
                  onProofreadingDecision={proofreadingDecision}
                  onLoadVersionHistory={fetchGalleyVersionsForManuscript}
                />
              ))}
            </div>

            {/* Empty state */}
            {filteredManuscripts.length === 0 && (
              <div className="text-center py-20 text-[#9e9e9e] font-['Public_Sans',sans-serif]">
                No manuscripts found for this filter.
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
