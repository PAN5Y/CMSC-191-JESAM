import { useState } from "react";
import { X, XCircle, AlertCircle, CheckCircle } from "lucide-react";
import type { ScreeningDecision, EditorDecision } from "../types";

export interface ScreeningManuscriptSummary {
  id: string;
  referenceLabel: string;
  title: string;
  authorsDisplay: string;
  classification: string | null;
}

interface ScreeningDecisionModalProps {
  manuscript: ScreeningManuscriptSummary;
  decidedBy: string;
  onClose: () => void;
  onBack: () => void;
  onSubmit: (decision: ScreeningDecision) => Promise<void>;
}

export function ScreeningDecisionModal({
  manuscript,
  decidedBy,
  onClose,
  onBack,
  onSubmit,
}: ScreeningDecisionModalProps) {
  const [rejectionReason, setRejectionReason] = useState("Not aligned with JESAM theme");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const rejectionReasons = [
    "Not aligned with JESAM theme",
    "Insufficient methodological rigor",
    "Scope too narrow or too broad",
    "Language quality issues",
    "Ethical concerns",
    "Duplicate submission",
    "Other (specify in comments)",
  ];

  const buildDecision = (decision: EditorDecision): ScreeningDecision => ({
    id: manuscript.id,
    decision,
    rejectionReason: decision === "reject" ? rejectionReason : undefined,
    comments: comments.trim() || undefined,
    decidedAt: new Date().toISOString(),
    decidedBy,
  });

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await onSubmit(buildDecision("reject"));
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnForFormatting = async () => {
    setSubmitting(true);
    try {
      await onSubmit(buildDecision("return-for-formatting"));
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await onSubmit(buildDecision("approve"));
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Screening decision</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{manuscript.referenceLabel}</span>
            {" — "}
            {manuscript.title}
          </p>

          <div>
            <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-900 mb-2">
              Rejection reason <span className="text-gray-500">(for reject)</span>
            </label>
            <select
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
            >
              {rejectionReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-900 mb-2">
              Editor-in-Chief comments
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add your comments here..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleReject()}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-6 h-6" />
              <span className="text-sm">Reject (out of scope)</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleReturnForFormatting()}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              <AlertCircle className="w-6 h-6" />
              <span className="text-sm">Return for formatting</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleApprove()}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-[#3d4a6b] text-white rounded-lg font-medium hover:bg-[#4a5875] transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-6 h-6" />
              <span className="text-sm">Approve for peer review</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-start">
          <button type="button" onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900">
            Back to details
          </button>
        </div>
      </div>
    </div>
  );
}
