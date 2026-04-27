import { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, FileText, Download, Eye, ArrowLeft } from 'lucide-react';

interface EditorViewProps {
  manuscript: {
    id: string;
    manuscriptId: string;
    dateSubmitted: string;
    title: string;
    authors: string;
    classification: string;
    status: string;
  };
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function EditorView({ manuscript, onBack, onApprove, onReject }: EditorViewProps) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');

  // Mock automated check results
  const automatedChecks = {
    formatting: {
      status: 'passed',
      checks: [
        { item: 'Template structure validated', passed: true },
        { item: 'Section headings verified', passed: true },
        { item: 'Citation format checked', passed: true },
        { item: 'Reference list formatting', passed: true },
      ],
    },
    assets: {
      status: 'passed',
      checks: [
        { item: 'Figure resolution ≥ 300 DPI', passed: true },
        { item: 'Author information removed (blinded)', passed: true },
        { item: 'File formats validated', passed: true },
        { item: 'Supplementary materials verified', passed: true },
      ],
    },
    plagiarism: {
      status: 'passed',
      similarityIndex: 12,
      threshold: 15,
      details: 'Similarity within acceptable threshold. No significant overlaps detected.',
    },
  };

  const handleSubmitDecision = () => {
    if (decision === 'approve') {
      onApprove();
    } else if (decision === 'reject') {
      onReject();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Editor Verification</h2>
          <p className="text-sm text-gray-600">Review automated checks and verify manuscript compliance</p>
        </div>
      </div>

      {/* Manuscript Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manuscript Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Manuscript ID</p>
            <p className="text-base font-medium text-gray-900">{manuscript.manuscriptId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Date Submitted</p>
            <p className="text-base font-medium text-gray-900">{manuscript.dateSubmitted}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-600 mb-1">Title</p>
            <p className="text-base font-medium text-gray-900">{manuscript.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Authors</p>
            <p className="text-base font-medium text-gray-900">{manuscript.authors}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Classification</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
              {manuscript.classification}
            </span>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Download Manuscript
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            <Eye className="w-4 h-4" />
            View Metadata
          </button>
        </div>
      </div>

      {/* Automated Checks Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Automated Verification Results</h3>

        {/* Formatting Check */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-1">1. Formatting Check</h4>
              <p className="text-sm text-gray-600">Template adherence and formatting requirements verified</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Passed
            </span>
          </div>
          <div className="ml-9 space-y-2">
            {automatedChecks.formatting.checks.map((check, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">{check.item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Validation */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-1">2. Asset Validation</h4>
              <p className="text-sm text-gray-600">Figure resolutions and blinding status checked</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Passed
            </span>
          </div>
          <div className="ml-9 space-y-2">
            {automatedChecks.assets.checks.map((check, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">{check.item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plagiarism Detection */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-1">3. Plagiarism Detection</h4>
              <p className="text-sm text-gray-600">Open-source plagiarism detection analysis</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Passed
            </span>
          </div>
          <div className="ml-9">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Similarity Index</span>
                <span className="text-lg font-bold text-green-700">
                  {automatedChecks.plagiarism.similarityIndex}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(automatedChecks.plagiarism.similarityIndex / automatedChecks.plagiarism.threshold) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                Threshold: {automatedChecks.plagiarism.threshold}% | {automatedChecks.plagiarism.details}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Decision */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Editor Decision</h3>

        {/* Decision Options */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setDecision('approve')}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              decision === 'approve'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                decision === 'approve'
                  ? 'border-green-600 bg-green-600'
                  : 'border-gray-300'
              }`}
            >
              {decision === 'approve' && (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Approve for Administrative Check</p>
              <p className="text-sm text-gray-600">All automated checks passed. Manuscript meets requirements.</p>
            </div>
          </button>

          <button
            onClick={() => setDecision('reject')}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              decision === 'reject'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                decision === 'reject'
                  ? 'border-red-600 bg-red-600'
                  : 'border-gray-300'
              }`}
            >
              {decision === 'reject' && (
                <XCircle className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Return to Author for Revision</p>
              <p className="text-sm text-gray-600">Issues found that require author attention.</p>
            </div>
          </button>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Editor Comments {decision === 'reject' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={decision === 'reject' ? 'Please specify the issues that need to be addressed...' : 'Optional: Add any comments or notes...'}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
          />
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onBack}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitDecision}
            disabled={!decision || (decision === 'reject' && !comments.trim())}
            className="px-6 py-2.5 bg-[#3d4a6b] text-white rounded-lg font-medium hover:bg-[#4a5875] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit Decision
          </button>
        </div>
      </div>

      {/* Information */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Editor Verification Process</p>
          <p>
            As the assigned Editor, you are responsible for verifying the automated checks and ensuring the manuscript meets all technical requirements before proceeding to the Administrative Check phase.
          </p>
        </div>
      </div>
    </div>
  );
}
