import { useState } from 'react';
import { X, XCircle, AlertCircle, CheckCircle } from 'lucide-react';

interface Manuscript {
  id: string;
  manuscriptId: string;
  title: string;
  authors: string;
  classification: string;
}

interface ScreeningDecisionModalProps {
  manuscript: Manuscript;
  onClose: () => void;
  onBack: () => void;
}

export function ScreeningDecisionModal({ manuscript, onClose, onBack }: ScreeningDecisionModalProps) {
  const [rejectionReason, setRejectionReason] = useState('Not aligned with JESAM theme');
  const [comments, setComments] = useState('');

  const rejectionReasons = [
    'Not aligned with JESAM theme',
    'Insufficient methodological rigor',
    'Scope too narrow or too broad',
    'Language quality issues',
    'Ethical concerns',
    'Duplicate submission',
    'Other (specify in comments)',
  ];

  const handleReject = () => {
    alert(`Manuscript ${manuscript.manuscriptId} rejected (Out of Scope)\nReason: ${rejectionReason}\nComments: ${comments}`);
    onClose();
  };

  const handleReturnForFormatting = () => {
    alert(`Manuscript ${manuscript.manuscriptId} returned for formatting fix\nComments: ${comments}`);
    onClose();
  };

  const handleApprove = () => {
    alert(`Manuscript ${manuscript.manuscriptId} approved for peer review\nComments: ${comments}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Manuscript Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section Title */}
          <h3 className="text-lg font-semibold text-gray-900">Screening Decision</h3>

          {/* Rejection Reason */}
          <div>
            <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-900 mb-2">
              Rejection Reason <span className="text-gray-500">(required for reject)</span>
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

          {/* Editor Comments */}
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-900 mb-2">
              Editor-in-Chief Comments
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

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            {/* Reject */}
            <button
              onClick={handleReject}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-6 h-6" />
              <span className="text-sm">Reject (Out of Scope)</span>
            </button>

            {/* Return for Formatting */}
            <button
              onClick={handleReturnForFormatting}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
            >
              <AlertCircle className="w-6 h-6" />
              <span className="text-sm">Return for Formatting Fix</span>
            </button>

            {/* Approve */}
            <button
              onClick={handleApprove}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-[#3d4a6b] text-white rounded-lg font-medium hover:bg-[#4a5875] transition-colors"
            >
              <CheckCircle className="w-6 h-6" />
              <span className="text-sm">Approve for Peer Review</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
