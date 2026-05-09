import { useEffect, useMemo } from 'react';
import { EditorInChiefScreening } from '../components/EditorInChiefScreening';
import { useSubmissions } from '../hooks/useSubmissions';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle2, Clock3, FileSearch, XCircle } from 'lucide-react';
import type { Manuscript } from '@/types';

const SCREENING_STATUSES = ['Initial Screening', 'Editor In Chief Screening'] as const;

function daysSince(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function oldest(list: Manuscript[]) {
  return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
}

export default function EditorInChiefDashboard() {
  const { user } = useAuth();
  const { manuscripts, loading, error, fetchManuscripts, recordScreeningDecision } =
    useSubmissions();

  useEffect(() => {
    void fetchManuscripts();
  }, [fetchManuscripts]);

  const manuscriptsForScreening = manuscripts.filter((m) =>
    SCREENING_STATUSES.includes(m.status as (typeof SCREENING_STATUSES)[number])
  );

  const dashboard = useMemo(() => {
    const productionChecks = manuscripts.filter((m) => m.status === 'Production Checks');
    const peerReview = manuscripts.filter((m) => m.status === 'Peer Review');
    const rejected = manuscripts.filter((m) => m.status === 'Rejected');
    const published = manuscripts.filter((m) => m.status === 'Published');
    const agedScreening = manuscriptsForScreening.filter((m) => daysSince(m.created_at) >= 3);
    const newestScreening = [...manuscriptsForScreening]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);

    return {
      productionChecks,
      peerReview,
      rejected,
      published,
      agedScreening,
      oldestScreening: oldest(manuscriptsForScreening),
      newestScreening,
      decidedTotal: productionChecks.length + peerReview.length + rejected.length + published.length,
    };
  }, [manuscripts, manuscriptsForScreening]);

  const decidedBy = user?.email ?? user?.id ?? 'unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Initial screening</h1>
              <p className="text-gray-600 mt-1">
                EIC and Managing Editor review new submissions before production checks.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "Needs screening",
              value: manuscriptsForScreening.length,
              detail: dashboard.oldestScreening
                ? `Oldest: ${daysSince(dashboard.oldestScreening.created_at)} days`
                : "Queue clear",
              icon: FileSearch,
              tone: "bg-blue-50 border-blue-100 text-blue-800",
            },
            {
              label: "Aging in queue",
              value: dashboard.agedScreening.length,
              detail: "3+ days since submission",
              icon: AlertCircle,
              tone: "bg-amber-50 border-amber-100 text-amber-800",
            },
            {
              label: "Sent to production",
              value: dashboard.productionChecks.length,
              detail: "Approved for checks",
              icon: CheckCircle2,
              tone: "bg-green-50 border-green-100 text-green-800",
            },
            {
              label: "Peer review",
              value: dashboard.peerReview.length,
              detail: "Past initial screening",
              icon: Clock3,
              tone: "bg-indigo-50 border-indigo-100 text-indigo-800",
            },
            {
              label: "Rejected",
              value: dashboard.rejected.length,
              detail: "Desk/production rejects",
              icon: XCircle,
              tone: "bg-red-50 border-red-100 text-red-800",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`rounded-lg border p-5 ${item.tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium opacity-80">{item.label}</p>
                    <p className="text-3xl font-bold mt-1">{item.value}</p>
                    <p className="text-xs mt-1 opacity-80">{item.detail}</p>
                  </div>
                  <Icon className="w-6 h-6 opacity-70" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-5 lg:col-span-2">
            <h2 className="font-semibold text-gray-900">Screening priorities</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manuscripts that should be reviewed first based on age in the queue.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {(dashboard.agedScreening.length > 0
                ? dashboard.agedScreening
                : dashboard.newestScreening
              ).slice(0, 4).map((m) => (
                <div key={m.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{m.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {m.reference_code ?? m.id.slice(0, 8)} - {daysSince(m.created_at)} days in queue
                  </p>
                </div>
              ))}
              {manuscriptsForScreening.length === 0 && (
                <p className="text-sm text-gray-500">No manuscripts need screening right now.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900">Editorial throughput</h2>
            <p className="text-sm text-gray-600 mt-1">High-level movement after initial screening.</p>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Decided / moved forward</span>
                <span className="font-semibold">{dashboard.decidedTotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Published outcomes</span>
                <span className="font-semibold">{dashboard.published.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current active corpus</span>
                <span className="font-semibold">
                  {manuscripts.filter((m) => !['Rejected', 'Published', 'Retracted'].includes(m.status)).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
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
            <p className="mt-4 text-gray-600">Loading manuscripts for review...</p>
          </div>
        ) : manuscriptsForScreening.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">No manuscripts available for screening</p>
            <p className="text-sm text-gray-500 mt-2">
              Manuscripts appear here immediately after author submission.
            </p>
          </div>
        ) : (
          <EditorInChiefScreening
            manuscripts={manuscriptsForScreening}
            decidedBy={decidedBy}
            onScreeningSubmit={recordScreeningDecision}
          />
        )}
      </div>
    </div>
  );
}
