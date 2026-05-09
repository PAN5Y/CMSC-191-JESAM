import { useMemo, useState } from "react";
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

  const dashboard = useMemo(() => {
    const accepted = manuscripts.filter((m) => m.status === "Accepted");
    const inProduction = manuscripts.filter((m) => m.status === "In Production");
    const published = manuscripts.filter((m) => m.status === "Published");
    const needsDoi = manuscripts.filter((m) => !m.doi && m.status !== "Published");
    const needsFile = manuscripts.filter((m) => !m.file_url);
    const readyToPublish = manuscripts.filter(
      (m) => m.title && m.authors.length > 0 && m.keywords.length > 0 && m.file_url && m.doi
    );
    return { accepted, inProduction, published, needsDoi, needsFile, readyToPublish };
  }, [manuscripts]);

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
        {!isAuthor && (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
            {[
              ["Accepted", dashboard.accepted.length, "Awaiting production"],
              ["In production", dashboard.inProduction.length, "Being prepared"],
              ["Ready to publish", dashboard.readyToPublish.length, "Metadata, file, DOI ready"],
              ["Needs DOI", dashboard.needsDoi.length, "DOI not assigned"],
              ["Needs file", dashboard.needsFile.length, "Missing manuscript file"],
              ["Published", dashboard.published.length, "Live articles"],
            ].map(([label, value, detail]) => (
              <div key={label} className="bg-white rounded-lg border border-[#e0e0e0] p-4">
                <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">{label}</p>
                <p className="text-3xl font-bold text-[#1a1c1c] mt-1">{value}</p>
                <p className="text-xs text-[#9e9e9e] mt-1">{detail}</p>
              </div>
            ))}
          </section>
        )}

        {!isAuthor && (dashboard.needsDoi.length > 0 || dashboard.needsFile.length > 0) && (
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
            <h3 className="font-semibold text-amber-950">Production attention needed</h3>
            <p className="text-sm text-amber-900 mt-1">
              Prioritize manuscripts with missing DOI or file readiness before publication.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...dashboard.needsDoi, ...dashboard.needsFile]
                .filter((m, index, arr) => arr.findIndex((x) => x.id === m.id) === index)
                .slice(0, 4)
                .map((m) => (
                  <div key={m.id} className="bg-white/80 rounded-lg border border-amber-200 p-3">
                    <p className="text-sm font-medium text-amber-950 line-clamp-1">{m.title}</p>
                    <p className="text-xs text-amber-800 mt-1">
                      {m.reference_code ?? m.id.slice(0, 8)} - {!m.doi ? "Needs DOI" : "Needs file"}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}

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
