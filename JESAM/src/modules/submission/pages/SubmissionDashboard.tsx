import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { SubmissionsTable } from '../components/SubmissionsTable';
import { useSubmissions } from '../hooks/useSubmissions';
import { Plus } from 'lucide-react';

export default function SubmissionDashboard() {
  const navigate = useNavigate();
  const { manuscripts, loading, error, fetchManuscripts } = useSubmissions();

  useEffect(() => {
    void fetchManuscripts();
  }, [fetchManuscripts]);

  const handleNewSubmission = () => {
    navigate('/author/submit');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
              <p className="text-gray-600 mt-1">
                Track your manuscripts from submission through format verification, EIC screening,
                and peer review
              </p>
            </div>
            <button
              type="button"
              onClick={handleNewSubmission}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">You haven't submitted any manuscripts yet</p>
          </div>
        ) : (
          <SubmissionsTable manuscripts={manuscripts} onNewSubmission={handleNewSubmission} />
        )}
      </div>
    </div>
  );
}
