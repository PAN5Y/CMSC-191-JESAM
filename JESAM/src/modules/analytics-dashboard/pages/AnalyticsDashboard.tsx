import { useEffect, useMemo } from "react";
import { useSubmissions } from "@/modules/submission/hooks/useSubmissions";

function pct(part: number, whole: number) {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

export default function AnalyticsDashboard() {
  const { manuscripts, fetchManuscripts } = useSubmissions();

  useEffect(() => {
    void fetchManuscripts();
  }, [fetchManuscripts]);

  const total = manuscripts.length;
  const published = manuscripts.filter((m) => m.status === "Published").length;
  const inReview = manuscripts.filter((m) => m.status === "Peer Review").length;
  const revision = manuscripts.filter((m) => m.status === "Revision Requested").length;
  const rejected = manuscripts.filter((m) => m.status === "Rejected").length;
  const pendingFormat = manuscripts.filter((m) => m.status === "Pending Format Verification").length;

  const focusStats = useMemo(() => {
    const stats = { Land: 0, Air: 0, Water: 0, People: 0 };
    manuscripts.forEach((m) => {
      if (m.classification && m.classification in stats) {
        stats[m.classification] += 1;
      }
    });
    return stats;
  }, [manuscripts]);

  const impactTotals = useMemo(
    () =>
      manuscripts.reduce(
        (acc, m) => {
          acc.views += m.metrics?.views ?? 0;
          acc.downloads += m.metrics?.downloads ?? 0;
          acc.citations += m.metrics?.citations ?? 0;
          return acc;
        },
        { views: 0, downloads: 0, citations: 0 }
      ),
    [manuscripts]
  );

  const workflowNotificationEvents = useMemo(
    () =>
      manuscripts.reduce((acc, m) => acc + (m.submission_metadata?.notifications?.length ?? 0), 0),
    [manuscripts]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Operational throughput and publication impact aligned to transcript-first reporting.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            ["Total", total.toString()],
            ["Pending format", `${pendingFormat} (${pct(pendingFormat, total)})`],
            ["Published", `${published} (${pct(published, total)})`],
            ["Peer Review", `${inReview} (${pct(inReview, total)})`],
            ["Revision", `${revision} (${pct(revision, total)})`],
            ["Rejected", `${rejected} (${pct(rejected, total)})`],
          ].map(([label, value]) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 uppercase">{label}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-1">Focus area distribution</h3>
            <p className="text-xs text-gray-500 mb-3">
              Proposal &quot;demographic&quot; analysis proxy: manuscripts by SESAM focus (Land/Air/Water/People).
              Geographic author demographics require extended profile fields.
            </p>
            <div className="space-y-3">
              {Object.entries(focusStats).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm">
                    <span>{key}</span>
                    <span>{val}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded mt-1">
                    <div className="h-2 bg-blue-600 rounded" style={{ width: pct(val, total) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Impact totals</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-gray-200 rounded p-3">
                <p className="text-xs text-gray-600">Views</p>
                <p className="text-xl font-semibold">{impactTotals.views}</p>
              </div>
              <div className="border border-gray-200 rounded p-3">
                <p className="text-xs text-gray-600">Downloads</p>
                <p className="text-xl font-semibold">{impactTotals.downloads}</p>
              </div>
              <div className="border border-gray-200 rounded p-3">
                <p className="text-xs text-gray-600">Citations</p>
                <p className="text-xl font-semibold">{impactTotals.citations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-1">Workflow notifications</h3>
            <p className="text-xs text-gray-500 mb-3">
              Event log entries stored on manuscripts (proposal: heavy notifications—in-system trail;
              email delivery optional).
            </p>
            <p className="text-3xl font-semibold text-gray-900">{workflowNotificationEvents}</p>
            <p className="text-xs text-gray-600 mt-2">Total notification records across corpus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
