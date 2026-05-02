import { useEffect } from 'react';
import { EditorInChiefScreening } from '../components/EditorInChiefScreening';
import { useSubmissions } from '../hooks/useSubmissions';
import { useAuth } from '@/contexts/AuthContext';
import { Crown } from 'lucide-react';

const SCREENING_STATUSES = ['Editor In Chief Screening'] as const;

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

  const decidedBy = user?.email ?? user?.id ?? 'unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editor-in-Chief screening</h1>
              <p className="text-gray-600 mt-1">
                Review new submissions immediately and issue desk decisions before peer review.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <p className="text-sm text-gray-600">Pending format verification</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {manuscripts.filter((m) => m.status === 'Pending Format Verification').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Handling editor queue (monitoring)</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <p className="text-sm text-gray-600">For screening</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {manuscriptsForScreening.length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <p className="text-sm text-gray-600">Peer review</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {manuscripts.filter((m) => m.status === 'Peer Review').length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {manuscripts.filter((m) => m.status === 'Published').length}
              </p>
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
              Manuscripts appear here after a handling editor clears format verification.
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
