import { useState } from "react";
import { useManuscripts } from "../hooks/useManuscripts";
import ManuscriptCard from "../components/ManuscriptCard";
import type { ManuscriptStatus } from "../types";

const statusTabs: { label: string; value: ManuscriptStatus | "all" | "terminal" }[] = [
  { label: "All", value: "all" },
  { label: "In Layout", value: "In Layout" },
  { label: "Proofreading", value: "Proofreading" },
  { label: "Author Review", value: "Author Galley Review" },
  { label: "Scheduled", value: "Scheduled for Publication" },
  { label: "Issue Mgmt", value: "In Issue Management" },
  { label: "Published", value: "Published" },
  { label: "Archived / Declined", value: "terminal" },
];

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
  const [activeTab, setActiveTab] = useState<ManuscriptStatus | "all" | "terminal">("all");

  const filteredManuscripts =
    activeTab === "all"
      ? manuscripts
      : activeTab === "terminal"
        ? manuscripts.filter(
            (m) => m.status === "Archived" || m.status === "Declined"
          )
        : manuscripts.filter((m) => m.status === activeTab);

  /* ── Stage counts for the summary bar ── */
  const counts: Record<string, number> = {};
  for (const tab of statusTabs) {
    if (tab.value === "all") {
      counts["all"] = manuscripts.length;
    } else if (tab.value === "terminal") {
      counts["terminal"] = manuscripts.filter(
        (m) => m.status === "Archived" || m.status === "Declined"
      ).length;
    } else {
      counts[tab.value] = manuscripts.filter((m) => m.status === tab.value).length;
    }
  }

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
                  {manuscripts.length} manuscript{manuscripts.length !== 1 && "s"}
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
