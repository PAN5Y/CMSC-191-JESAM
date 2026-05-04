import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useManuscripts } from "../hooks/useManuscripts";
import ManuscriptTable from "../components/ManuscriptTable";
import ManuscriptCard from "../components/ManuscriptCard";
import type { ManuscriptStatus } from "../types";

const statusTabs: { label: string; value: ManuscriptStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Accepted", value: "Accepted" },
  { label: "In Production", value: "In Production" },
  { label: "Published", value: "Published" },
];

export default function PublicationDashboard() {
  const { role } = useAuth();
  const { manuscripts, loading, error, fetchManuscripts } = useManuscripts({
    publicationOnly: true,
  });
  const [activeTab, setActiveTab] = useState<ManuscriptStatus | "all">("all");

  const isAuthor = role === "author";

  const filteredManuscripts =
    activeTab === "all"
      ? manuscripts
      : manuscripts.filter((m) => m.status === activeTab);

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-[#e0e0e0]">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-['Newsreader',serif] text-[24px] text-[#3f4b7e] mb-1">
                Publication & Impact Module
              </h2>
              <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
                {!isAuthor
                  ? "Editor Dashboard - Manage accepted manuscripts"
                  : "Author Portal - Track your manuscript progress"}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
                  {manuscripts.length} manuscripts
                </div>
                <div className="text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
                  Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-8">
        {/* Status filter tabs */}
        <div className="flex items-center gap-2 mb-6">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-['Public_Sans',sans-serif] transition-all ${
                activeTab === tab.value
                  ? "bg-[#3f4b7e] text-white"
                  : "bg-white border border-[#e0e0e0] text-[#6b7280] hover:border-[#3f4b7e]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="font-['Newsreader',serif] text-[24px] text-[#1a1c1c] mb-2">
            {!isAuthor ? "Accepted Manuscripts" : "Your Manuscripts"}
          </h2>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
            {!isAuthor
              ? "Select a manuscript to proceed with the publication workflow"
              : "Track the publication status of your submitted manuscripts"}
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

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Editor View - Table */}
            {!isAuthor && (
              <ManuscriptTable manuscripts={filteredManuscripts} />
            )}

            {/* Author View - Cards */}
            {isAuthor && (
              <div className="grid gap-6">
                {filteredManuscripts.map((manuscript) => (
                  <ManuscriptCard key={manuscript.id} manuscript={manuscript} />
                ))}
              </div>
            )}

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
