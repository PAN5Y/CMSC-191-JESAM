import { useEffect } from 'react';
import { EditorInChiefScreening } from '../components/EditorInChiefScreening';
import { useSubmissions } from '../hooks/useSubmissions';
import { Crown } from 'lucide-react';

export default function EditorInChiefDashboard() {
  const { manuscripts, loading, error, fetchManuscripts } = useSubmissions();

  useEffect(() => {
    fetchManuscripts();
  }, []);

  const manuscriptsForScreening = manuscripts.filter(m =>
    ['In Submission Queue', 'Administrative Check', 'Editor In Chief Screening'].includes(m.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editor-in-Chief Screening</h1>
              <p className="text-gray-600 mt-1">
                Review and make decisions on manuscript submissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <p className="text-sm text-gray-600">For Review</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {manuscriptsForScreening.length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <p className="text-sm text-gray-600">In Submission Queue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {manuscripts.filter(m => m.status === 'In Submission Queue').length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <p className="text-sm text-gray-600">Peer Review</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {manuscripts.filter(m => m.status === 'Peer Review').length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {manuscripts.filter(m => m.status === 'Published').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
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
          </div>
        ) : (
          <EditorInChiefScreening />
        )}
      </div>
    </div>
  );
}
