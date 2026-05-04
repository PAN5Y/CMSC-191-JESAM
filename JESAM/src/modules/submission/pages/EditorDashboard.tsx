import { useEffect } from "react";
import { useSubmissions } from "../hooks/useSubmissions";
import { CheckCircle2, FileSearch } from "lucide-react";
import { EditorVerificationTable } from "../components/EditorVerificationTable";

export default function EditorDashboard() {
  const {
    manuscripts,
    loading,
    error,
    fetchManuscripts,
    recordEditorVerification,
  } = useSubmissions();

  useEffect(() => {
    void fetchManuscripts();
  }, [fetchManuscripts]);

  const formatQueue = manuscripts.filter((m) => m.status === "Pending Format Verification");
  const eicScreening = manuscripts.filter((m) => m.status === "Editor In Chief Screening");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Submission queue</h1>
          <p className="text-gray-600 mt-1">
            Verify automated formatting and template checks, then forward cleared manuscripts to
            Editor-in-Chief screening.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending format verification</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatQueue.length}</p>
              </div>
              <FileSearch className="w-12 h-12 text-sky-500 opacity-30" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In EIC screening</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{eicScreening.length}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <p className="text-sm text-gray-600">Total visible</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{manuscripts.length}</p>
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
            <p className="mt-4 text-gray-600">Loading submissions...</p>
          </div>
        ) : (
          <EditorVerificationTable
            manuscripts={formatQueue}
            onApprove={(id) => recordEditorVerification(id, "approve")}
            onReturnToAuthor={(id, comments) => recordEditorVerification(id, "return", comments)}
          />
        )}
      </div>
    </div>
  );
}
