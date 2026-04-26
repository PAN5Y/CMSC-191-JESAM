import { useState } from 'react';
import { X, Users, CheckCircle2 } from 'lucide-react';
import { ScreeningDecisionModal } from './ScreeningDecisionModal';

interface Manuscript {
  id: string;
  manuscriptId: string;
  title: string;
  authors: string;
  classification: 'Land' | 'Air' | 'Water' | 'People';
  similarity: number;
  abstract: string;
  formattingStatus: 'Passed' | 'Failed';
}

interface ManuscriptDetailsModalProps {
  manuscript: Manuscript;
  onClose: () => void;
}

export function ManuscriptDetailsModal({ manuscript, onClose }: ManuscriptDetailsModalProps) {
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Land':
        return 'bg-amber-100 text-amber-800';
      case 'Air':
        return 'bg-cyan-100 text-cyan-800';
      case 'Water':
        return 'bg-blue-100 text-blue-800';
      case 'People':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSimilarityBarColor = (similarity: number) => {
    if (similarity < 15) return 'bg-green-500';
    if (similarity < 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (showDecisionModal) {
    return (
      <ScreeningDecisionModal
        manuscript={manuscript}
        onClose={onClose}
        onBack={() => setShowDecisionModal(false)}
      />
    );
  }

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
          {/* Manuscript ID and Classification */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Manuscript ID: {manuscript.manuscriptId}</p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getClassificationColor(
                manuscript.classification
              )}`}
            >
              {manuscript.classification}
            </span>
          </div>

          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {manuscript.title}
            </h3>
          </div>

          {/* Authors */}
          <div className="flex items-start gap-2">
            <Users className="w-5 h-5 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-700">{manuscript.authors}</p>
          </div>

          {/* Abstract */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Abstract</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {manuscript.abstract}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-6">
            {/* Similarity Score */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Similarity Score</h4>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getSimilarityBarColor(manuscript.similarity)}`}
                    style={{ width: `${manuscript.similarity}%` }}
                  />
                </div>
                <p className="text-2xl font-bold text-gray-900">{manuscript.similarity}%</p>
              </div>
            </div>

            {/* Formatting Status */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Formatting Status</h4>
              <div className="flex items-center gap-2">
                {manuscript.formattingStatus === 'Passed' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Passed</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Failed</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => setShowDecisionModal(true)}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            Make Decision
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
