import { useState } from 'react';
import { X, Users, CheckCircle2 } from 'lucide-react';
import type { Manuscript } from '@/types';
import ManuscriptPdfViewer from '@/components/common/ManuscriptPdfViewer';
import { ScreeningDecisionModal, type ScreeningManuscriptSummary } from './ScreeningDecisionModal';
import type { ScreeningDecision } from '../types';

interface ManuscriptDetailsModalProps {
  manuscript: Manuscript;
  decidedBy: string;
  onClose: () => void;
  onSubmitScreening: (decision: ScreeningDecision) => Promise<void>;
}

function formattingPassed(m: Manuscript): boolean {
  const st = m.submission_metadata?.automated_checks?.formatting?.status;
  return st === 'passed';
}

function similarityPercent(m: Manuscript): number {
  const s = m.submission_metadata?.similarity_score;
  if (typeof s === 'number' && !Number.isNaN(s)) return s;
  return 0;
}

export function ManuscriptDetailsModal({
  manuscript,
  decidedBy,
  onClose,
  onSubmitScreening,
}: ManuscriptDetailsModalProps) {
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  const refLabel = manuscript.reference_code ?? manuscript.id.slice(0, 8).toUpperCase();
  const authorsDisplay = manuscript.authors.join(', ');
  const cls = manuscript.classification ?? '—';
  const sim = similarityPercent(manuscript);

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
    if (similarity <= 15) return 'bg-green-500';
    if (similarity <= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const summary: ScreeningManuscriptSummary = {
    id: manuscript.id,
    referenceLabel: refLabel,
    title: manuscript.title,
    authorsDisplay,
    classification: manuscript.classification,
  };

  if (showDecisionModal) {
    return (
      <ScreeningDecisionModal
        manuscript={summary}
        decidedBy={decidedBy}
        onClose={onClose}
        onBack={() => setShowDecisionModal(false)}
        onSubmit={onSubmitScreening}
      />
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Manuscript details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <ManuscriptPdfViewer
            fileUrl={manuscript.file_url}
            title={`${manuscript.title} manuscript PDF`}
          />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Reference: {refLabel}</p>
              <p className="text-xs text-gray-400 font-mono">{manuscript.id}</p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getClassificationColor(
                cls === '—' ? '' : cls
              )}`}
            >
              {cls}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{manuscript.title}</h3>
          </div>

          <div className="flex items-start gap-2">
            <Users className="w-5 h-5 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-700">{authorsDisplay}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Abstract</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{manuscript.abstract}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Similarity score</h4>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getSimilarityBarColor(sim)}`}
                    style={{ width: `${Math.min(sim, 100)}%` }}
                  />
                </div>
                <p className="text-2xl font-bold text-gray-900">{sim}%</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Formatting (automated)</h4>
              <div className="flex items-center gap-2">
                {formattingPassed(manuscript) ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Passed</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      Pending or not passed
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={() => setShowDecisionModal(true)}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            Make decision
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
