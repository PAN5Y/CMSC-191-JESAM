import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import type { Manuscript } from "@/types";
import ManuscriptPdfViewer from "@/components/common/ManuscriptPdfViewer";

const SIMILARITY_THRESHOLD = 30;

interface EditorViewProps {
  manuscript: Manuscript;
  onBack: () => void;
  onApprove: () => void | Promise<void>;
  onReject: (comments: string) => void | Promise<void>;
}

export function EditorView({ manuscript, onBack, onApprove, onReject }: EditorViewProps) {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [comments, setComments] = useState("");

  const refLabel = manuscript.reference_code ?? manuscript.id.slice(0, 8).toUpperCase();
  const dateSubmitted = new Date(manuscript.created_at).toLocaleDateString();
  const authorsDisplay = manuscript.authors.join(", ");
  const ac = manuscript.submission_metadata?.automated_checks;
  const similarity =
    typeof manuscript.submission_metadata?.similarity_score === "number"
      ? manuscript.submission_metadata.similarity_score
      : 0;

  const formattingPassed = ac?.formatting?.status === "passed";
  const assetsPassed = ac?.assets?.status === "passed";
  const plagiarismPassed = ac?.plagiarism?.status === "passed";

  const handleSubmitDecision = async () => {
    if (decision === "approve") {
      await onApprove();
    } else if (decision === "reject") {
      await onReject(comments.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Format verification</h2>
          <p className="text-sm text-gray-600">
            Confirm automated template and quality checks. Approve to send to Editor-in-Chief
            screening, or return to the author with comments.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manuscript details</h3>
        <ManuscriptPdfViewer
          fileUrl={manuscript.file_url}
          title={`${manuscript.title} manuscript PDF`}
          className="mb-6"
        />
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Reference</p>
            <p className="text-base font-medium text-gray-900">{refLabel}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Date submitted</p>
            <p className="text-base font-medium text-gray-900">{dateSubmitted}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-600 mb-1">Title</p>
            <p className="text-base font-medium text-gray-900">{manuscript.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Authors</p>
            <p className="text-base font-medium text-gray-900">{authorsDisplay}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Classification</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
              {manuscript.classification ?? "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Automated verification results</h3>

        <div
          className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
            formattingPassed ? "border-green-200" : "border-amber-200"
          }`}
        >
          <div className="flex items-start gap-3 mb-2">
            {formattingPassed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-1">1. Formatting check</h4>
              <p className="text-sm text-gray-600">{ac?.formatting?.message || "No automated message stored."}</p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                formattingPassed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {formattingPassed ? "Passed" : "Review"}
            </span>
          </div>
        </div>

        <div
          className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
            assetsPassed ? "border-green-200" : "border-amber-200"
          }`}
        >
          <div className="flex items-start gap-3 mb-2">
            {assetsPassed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-1">2. Asset validation</h4>
              <p className="text-sm text-gray-600">{ac?.assets?.message || "No automated message stored."}</p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                assetsPassed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {assetsPassed ? "Passed" : "Review"}
            </span>
          </div>
        </div>

        <div
          className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
            plagiarismPassed ? "border-green-200" : "border-red-200"
          }`}
        >
          <div className="flex items-start gap-3 mb-2">
            {plagiarismPassed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-1">3. Similarity screening</h4>
              <p className="text-sm text-gray-600">{ac?.plagiarism?.message || "No automated message stored."}</p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                plagiarismPassed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {plagiarismPassed ? "Passed" : "Failed"}
            </span>
          </div>
          <div className="ml-9 mt-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Similarity index</span>
              <span className={`text-lg font-bold ${similarity <= SIMILARITY_THRESHOLD ? "text-green-700" : "text-red-700"}`}>
                {similarity}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${similarity <= SIMILARITY_THRESHOLD ? "bg-green-600" : "bg-red-600"}`}
                style={{ width: `${Math.min((similarity / SIMILARITY_THRESHOLD) * 100, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Threshold: {SIMILARITY_THRESHOLD}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Editor decision</h3>

        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => setDecision("approve")}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              decision === "approve"
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                decision === "approve" ? "border-green-600 bg-green-600" : "border-gray-300"
              }`}
            >
              {decision === "approve" && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Forward to EIC screening</p>
              <p className="text-sm text-gray-600">Manuscript is ready for Editor-in-Chief screening.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDecision("reject")}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              decision === "reject" ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                decision === "reject" ? "border-red-600 bg-red-600" : "border-gray-300"
              }`}
            >
              {decision === "reject" && <XCircle className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Return to author</p>
              <p className="text-sm text-gray-600">Issues require author attention before continuing.</p>
            </div>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Editor comments {decision === "reject" && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={
              decision === "reject"
                ? "Specify what the author should address..."
                : "Optional notes for editorial records..."
            }
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmitDecision()}
            disabled={!decision || (decision === "reject" && !comments.trim())}
            className="px-6 py-2.5 bg-[#3d4a6b] text-white rounded-lg font-medium hover:bg-[#4a5875] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit decision
          </button>
        </div>
      </div>

      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Editorial support review</p>
          <p>Support checks only; initial submission decisions are finalized in EIC screening.</p>
        </div>
      </div>
    </div>
  );
}
