import { useMemo } from "react";
import { useNavigate } from "react-router";
import { BarChart3, CheckCircle2, FileSearch, Tags } from "lucide-react";
import { useManuscripts } from "@/modules/publication-impact/hooks/useManuscripts";
import type { AutomatedCheckSnapshot } from "@/types";

function checkPassed(checks: AutomatedCheckSnapshot | undefined): boolean {
  return (
    checks?.formatting.status === "passed" &&
    checks.assets.status === "passed" &&
    checks.plagiarism.status === "passed"
  );
}

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

export default function ProductionPreReviewDashboard() {
  const navigate = useNavigate();
  const { manuscripts, loading, error, fetchManuscripts } = useManuscripts({
    filterStatus: "Production Checks",
  });

  const dashboard = useMemo(() => {
    const unchecked = manuscripts.filter((m) => !m.submission_metadata?.automated_checks);
    const checked = manuscripts.filter((m) => !!m.submission_metadata?.automated_checks);
    const failed = checked.filter((m) => !checkPassed(m.submission_metadata?.automated_checks));
    const returnedRevision = manuscripts.filter(
      (m) => (m.submission_metadata?.revision_cycle?.rounds?.length ?? 0) > 0
    );
    const oldest = [...manuscripts].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];
    const keywordStats = topEntries(manuscripts.flatMap((m) => m.keywords), 6);
    const subjectStats = topEntries(
      manuscripts.map((m) => m.submission_metadata?.subjectArea ?? ""),
      5
    );
    const similarityScores = manuscripts
      .map((m) => m.submission_metadata?.similarity_score)
      .filter((score): score is number => typeof score === "number");
    const averageSimilarity =
      similarityScores.length > 0
        ? Math.round(similarityScores.reduce((sum, score) => sum + score, 0) / similarityScores.length)
        : null;
    const metadataReady = manuscripts.filter(
      (m) =>
        m.keywords.length >= 3 &&
        !!m.submission_metadata?.subjectArea &&
        (m.submission_metadata?.author_details ?? []).every((author) => author.affiliation.trim())
    );

    return {
      unchecked,
      checked,
      failed,
      returnedRevision,
      oldest,
      keywordStats,
      subjectStats,
      averageSimilarity,
      metadataReady,
    };
  }, [manuscripts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Pre-review production checks</h1>
          <p className="text-gray-600 mt-1">
            Select a manuscript from the queue to open its dedicated production checks workspace.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
            <p className="mt-4 text-gray-600">Loading production checks queue...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {[
                ["Needs checks", dashboard.unchecked.length, "No saved check run"],
                ["Checks completed", dashboard.checked.length, "Ready for decision"],
                ["Checks with issues", dashboard.failed.length, "Likely return/reject"],
                ["Returned revisions", dashboard.returnedRevision.length, "Author resubmissions"],
                [
                  "Oldest queue age",
                  dashboard.oldest
                    ? Math.max(
                        0,
                        Math.floor(
                          (Date.now() - new Date(dashboard.oldest.created_at).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    : 0,
                  "Days since submission",
                ],
              ].map(([label, value, detail]) => (
                <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{detail}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5 lg:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">Pre-review knowledge signals</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Topic and metadata patterns visible to production before peer review routing.
                    </p>
                  </div>
                  <Tags className="w-5 h-5 text-blue-600 shrink-0" />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900">Queued keywords</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dashboard.keywordStats.map(([keyword, count]) => (
                        <span key={keyword} className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs text-blue-700">
                          {keyword} ({count})
                        </span>
                      ))}
                      {dashboard.keywordStats.length === 0 && (
                        <p className="text-sm text-gray-500">No queued keyword patterns yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900">Subject areas in checks</p>
                    <div className="mt-3 space-y-2">
                      {dashboard.subjectStats.map(([subject, count]) => (
                        <div key={subject} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-gray-700">{subject.replace(/-/g, " ")}</span>
                          <span className="font-semibold text-gray-900">{count}</span>
                        </div>
                      ))}
                      {dashboard.subjectStats.length === 0 && (
                        <p className="text-sm text-gray-500">Subject areas will appear after metadata capture.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">Indexing readiness</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Metadata quality before manuscripts leave production checks.
                    </p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-green-600 shrink-0" />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Metadata-ready</span>
                    <span className="font-semibold">
                      {dashboard.metadataReady.length}/{manuscripts.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average similarity</span>
                    <span className="font-semibold">
                      {dashboard.averageSimilarity ?? "No data"}
                      {dashboard.averageSimilarity !== null ? "%" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Checks with issues</span>
                    <span className="font-semibold">{dashboard.failed.length}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border-2 border-blue-200 bg-blue-50/60 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-semibold text-blue-950">Production checks queue</h2>
                  <p className="text-xs text-blue-800">{manuscripts.length} manuscript(s) awaiting production handling</p>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchManuscripts()}
                  className="text-sm font-medium text-blue-700 hover:underline"
                >
                  Refresh
                </button>
              </div>

              <div className="divide-y divide-blue-100 overflow-hidden rounded-lg border border-blue-200 bg-white">
                {manuscripts.map((m) => {
                  const ref = m.reference_code ?? m.id.slice(0, 8).toUpperCase();
                  const hasChecks = !!m.submission_metadata?.automated_checks;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => navigate(`/production/pre-review/${m.id}`)}
                      className="w-full cursor-pointer bg-white p-4 text-left transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{ref}</p>
                            <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                              {m.classification ?? "Unclassified"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-900 line-clamp-1">{m.title}</p>
                          <p className="mt-1 text-xs text-gray-600 line-clamp-1">{m.authors.join(", ")}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          {hasChecks ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Checks saved
                            </>
                          ) : (
                            <>
                              <FileSearch className="w-4 h-4 text-gray-400" />
                              Awaiting checks
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {manuscripts.length === 0 && (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    No manuscripts are waiting for production checks.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
