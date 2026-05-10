import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { SubmissionsTable } from '../components/SubmissionsTable';
import { useSubmissions } from '../hooks/useSubmissions';
import { AlertCircle, BarChart3, CheckCircle2, Clock3, FileText, Lightbulb, Plus, Tag, XCircle } from 'lucide-react';
import type { Manuscript, ManuscriptStatus } from '@/types';
import { getAuthorDecisionFeedback } from '@/lib/manuscript-feedback';

const AUTHOR_ACTION_STATUSES = new Set<ManuscriptStatus>([
  "For Format Revision",
  "Revision Requested",
  "Returned to Author",
  "Return to Revision",
]);

function pct(part: number, whole: number) {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function daysSince(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function statusCount(manuscripts: Manuscript[], statuses: ManuscriptStatus[]) {
  return manuscripts.filter((m) => statuses.includes(m.status)).length;
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

export default function SubmissionDashboard() {
  const navigate = useNavigate();
  const { manuscripts, loading, error, fetchManuscripts } = useSubmissions();

  useEffect(() => {
    void fetchManuscripts();
  }, [fetchManuscripts]);

  const handleNewSubmission = () => {
    navigate('/author/submit');
  };

  const dashboard = useMemo(() => {
    const total = manuscripts.length;
    const needsAction = manuscripts.filter((m) => AUTHOR_ACTION_STATUSES.has(m.status));
    const active = manuscripts.filter(
      (m) => !["Rejected", "Published", "Retracted"].includes(m.status)
    );
    const published = manuscripts.filter((m) => m.status === "Published");
    const rejected = manuscripts.filter((m) => m.status === "Rejected");
    const inReview = manuscripts.filter((m) => m.status === "Peer Review");
    const rejectedWithFeedback = rejected.filter((m) => getAuthorDecisionFeedback(m)?.comments);
    const impactTotals = published.reduce(
      (acc, m) => {
        acc.views += m.metrics?.views ?? 0;
        acc.downloads += m.metrics?.downloads ?? 0;
        acc.citations += m.metrics?.citations ?? 0;
        return acc;
      },
      { views: 0, downloads: 0, citations: 0 }
    );
    const topKeywords = topEntries(manuscripts.flatMap((m) => m.keywords), 6);
    const subjectAreas = topEntries(
      manuscripts.map((m) => m.submission_metadata?.subjectArea ?? ""),
      4
    );
    const missingIndexingInfo = manuscripts.filter((m) => {
      const authorDetails = m.submission_metadata?.author_details ?? [];
      return (
        m.keywords.length < 3 ||
        authorDetails.some((author) => !author.orcid?.trim() || !author.affiliation.trim())
      );
    });
    const newest = [...manuscripts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
    const oldestActive = [...active]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

    return {
      total,
      needsAction,
      active,
      published,
      rejected,
      rejectedWithFeedback,
      inReview,
      impactTotals,
      topKeywords,
      subjectAreas,
      missingIndexingInfo,
      newest,
      oldestActive,
      intake: statusCount(manuscripts, ["Initial Screening", "Production Checks", "For Format Revision"]),
      review: statusCount(manuscripts, ["Peer Review", "Revision Requested"]),
      production: statusCount(manuscripts, ["Accepted", "In Production"]),
    };
  }, [manuscripts]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Submissions</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 max-w-2xl">
                Track your manuscripts from submission through initial screening, production
                checks, and peer review
              </p>
            </div>
            <button
              type="button"
              onClick={handleNewSubmission}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Submission
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading your submissions...</p>
          </div>
        ) : manuscripts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-12 text-center">
            <p className="text-gray-600 mb-4">You haven't submitted any manuscripts yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  label: "Total manuscripts",
                  value: dashboard.total,
                  detail: `${dashboard.active.length} active`,
                  icon: FileText,
                  tone: "text-blue-700 bg-blue-50 border-blue-100",
                },
                {
                  label: "Needs your action",
                  value: dashboard.needsAction.length,
                  detail: "Revision or response required",
                  icon: AlertCircle,
                  tone: "text-gray-900 bg-white border-gray-200",
                  iconTone: "text-amber-600 bg-amber-50",
                },
                {
                  label: "Published",
                  value: dashboard.published.length,
                  detail: `${pct(dashboard.published.length, dashboard.total)} of submissions`,
                  icon: CheckCircle2,
                  tone: "text-green-700 bg-green-50 border-green-100",
                },
                {
                  label: "Rejected",
                  value: dashboard.rejected.length,
                  detail: `${pct(dashboard.rejected.length, dashboard.total)} of submissions`,
                  icon: XCircle,
                  tone: "text-gray-900 bg-white border-gray-200",
                  iconTone: "text-red-600 bg-red-50",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`rounded-lg border p-4 ${item.tone}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{item.label}</p>
                        <p className="text-3xl font-bold mt-1">{item.value}</p>
                        <p className="text-xs mt-1 text-gray-500">{item.detail}</p>
                      </div>
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          item.iconTone ?? "text-current bg-white/50"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5 xl:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">Personal knowledge profile</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Themes and indexing signals from your own manuscript history.
                    </p>
                  </div>
                  <Tag className="w-5 h-5 text-blue-600 shrink-0" />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900">Frequent keywords</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dashboard.topKeywords.map(([keyword, count]) => (
                        <span key={keyword} className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs text-blue-700">
                          {keyword} ({count})
                        </span>
                      ))}
                      {dashboard.topKeywords.length === 0 && (
                        <p className="text-sm text-gray-500">Add keywords to submitted manuscripts to build this profile.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900">Subject concentration</p>
                    <div className="mt-3 space-y-2">
                      {dashboard.subjectAreas.map(([subject, count]) => (
                        <div key={subject} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-gray-700">{subject.replace(/-/g, " ")}</span>
                          <span className="font-semibold text-gray-900">{count}</span>
                        </div>
                      ))}
                      {dashboard.subjectAreas.length === 0 && (
                        <p className="text-sm text-gray-500">Subject areas will appear after submission.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">Published impact</h2>
                    <p className="text-sm text-gray-600 mt-1">Private author view of public article reach.</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-green-600 shrink-0" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["Views", dashboard.impactTotals.views],
                    ["Downloads", dashboard.impactTotals.downloads],
                    ["Citations", dashboard.impactTotals.citations],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-gray-200 p-3 text-center">
                      <p className="text-lg font-semibold text-gray-900">{value}</p>
                      <p className="text-[11px] text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {dashboard.missingIndexingInfo.length > 0 && (
              <section className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
                  <div>
                    <h2 className="font-semibold text-blue-950">Indexing readiness reminders</h2>
                    <p className="text-sm text-blue-900 mt-1">
                      {dashboard.missingIndexingInfo.length} manuscript(s) may need stronger metadata:
                      at least three keywords, complete affiliations, and ORCID where available. This
                      helps JESAM surface stronger author and topic knowledge later.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5 xl:col-span-2">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">Progress overview</h2>
                    <p className="text-sm text-gray-600">Where your manuscripts are right now.</p>
                  </div>
                  {dashboard.oldestActive && (
                    <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                      <Clock3 className="w-3.5 h-3.5" />
                      Oldest active: {daysSince(dashboard.oldestActive.created_at)} days
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    ["Intake and checks", dashboard.intake, "Initial screening, production checks, format revision"],
                    ["Peer review", dashboard.review, "Reviewer assignment, review, revision decisions"],
                    ["Publication", dashboard.production, "Accepted or in production"],
                  ].map(([label, value, detail]) => (
                    <div key={label} className="rounded-lg border border-gray-200 p-4">
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                      <p className="text-xs text-gray-500 mt-1">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900">Recent submissions</h2>
                <div className="mt-3 space-y-3">
                  {dashboard.newest.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => navigate(`/author/article/${m.id}`)}
                      className="w-full text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{m.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {m.reference_code ?? m.id.slice(0, 8)} - {m.status}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {dashboard.needsAction.length > 0 && (
              <section className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">Needs your action</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Manuscripts waiting for your revision or response.
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    {dashboard.needsAction.length} pending
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {dashboard.needsAction.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => navigate("/revision")}
                      className="text-left rounded-lg border border-gray-200 p-4 hover:border-amber-200 hover:bg-amber-50/40"
                    >
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{m.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {m.reference_code ?? m.id.slice(0, 8)} - {m.status}
                      </p>
                      {m.submission_metadata?.production_decision_comments && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {m.submission_metadata.production_decision_comments}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {dashboard.rejectedWithFeedback.length > 0 && (
              <section className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">Rejected manuscripts feedback</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Decision notes from editorial screening or production checks.
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    {dashboard.rejectedWithFeedback.length} with feedback
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {dashboard.rejectedWithFeedback.map((m) => {
                    const feedback = getAuthorDecisionFeedback(m);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => navigate(`/author/article/${m.id}`)}
                        className="text-left rounded-lg border border-gray-200 p-4 hover:border-red-200 hover:bg-red-50/30"
                      >
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{m.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {m.reference_code ?? m.id.slice(0, 8)} - {feedback?.source}
                        </p>
                        <p className="text-xs text-gray-600 mt-2 line-clamp-3 whitespace-pre-wrap">
                          {feedback?.comments}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <SubmissionsTable manuscripts={manuscripts} onNewSubmission={handleNewSubmission} />
          </div>
        )}
      </div>
    </div>
  );
}
