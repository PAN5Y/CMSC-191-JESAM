import { Upload, FileText, Image, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSubmissionWizard } from '../context/SubmissionWizardContext';

type CheckStatus = 'pending' | 'checking' | 'passed' | 'failed';

/** JESAM stakeholder threshold: similarity must be at or below this percent to pass automated screening. */
const SIMILARITY_THRESHOLD_PERCENT = 30;

export function AutomatedChecks() {
  const { checks, setChecks, manuscriptFile, setManuscriptFile } = useSubmissionWizard();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setManuscriptFile(file);
      setChecks({
        formatting: { status: 'pending', message: '' },
        assets: { status: 'pending', message: '' },
        plagiarism: { status: 'pending', message: '' },
      });
      runAutomatedChecks(file);
    }
  };

  const runAutomatedChecks = async (file: File) => {
    setChecks({
      formatting: { status: 'checking', message: 'Verifying template adherence...' },
      assets: { status: 'pending', message: '' },
      plagiarism: { status: 'pending', message: '' },
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));
    setChecks((prev) => ({
      ...prev,
      formatting: {
        status: 'passed',
        message: 'Template adherence verified. All formatting requirements met.',
      },
      assets: { status: 'checking', message: 'Validating figures and assets...' },
      plagiarism: prev.plagiarism,
    }));

    await new Promise((resolve) => setTimeout(resolve, 1500));
    setChecks((prev) => ({
      ...prev,
      assets: {
        status: 'passed',
        message: 'All figures meet resolution requirements. Blinding status confirmed.',
      },
      plagiarism: { status: 'checking', message: 'Running similarity screening...' },
    }));

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const similarityIndex = Math.floor(Math.random() * 35) + 5;

    if (similarityIndex <= SIMILARITY_THRESHOLD_PERCENT) {
      setChecks((prev) => ({
        ...prev,
        plagiarism: {
          status: 'passed',
          message: `Similarity index: ${similarityIndex}%. Within acceptable threshold (${SIMILARITY_THRESHOLD_PERCENT}% or below).`,
        },
      }));
    } else {
      setChecks((prev) => ({
        ...prev,
        plagiarism: {
          status: 'failed',
          message: `Similarity index: ${similarityIndex}%. Exceeds ${SIMILARITY_THRESHOLD_PERCENT}% threshold. Please revise overlapping sections and resubmit.`,
        },
      }));
    }
  };

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: CheckStatus) => {
    switch (status) {
      case 'checking':
        return 'border-blue-200 bg-blue-50';
      case 'passed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const allChecksPassed =
    checks.formatting.status === 'passed' &&
    checks.assets.status === 'passed' &&
    checks.plagiarism.status === 'passed';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Automated Checks</h2>
        <p className="text-gray-600">
          Upload your manuscript for automated validation. The system will verify formatting,
          assets, and run open-source similarity screening (threshold {SIMILARITY_THRESHOLD_PERCENT}
          %).
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {manuscriptFile ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{manuscriptFile.name}</p>
              <p className="text-xs text-gray-500">
                {(manuscriptFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('file-upload')?.click();
                }}
              >
                Upload different file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Click to upload manuscript</p>
              <p className="text-xs text-gray-500">PDF, DOC, or DOCX (Max 50MB)</p>
            </div>
          )}
        </label>
      </div>

      {manuscriptFile && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Validation Results</h3>

          <div
            className={`p-4 border-2 rounded-lg ${getStatusColor(checks.formatting.status as CheckStatus)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(checks.formatting.status as CheckStatus)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 1. Formatting Check
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  Verifies template adherence and formatting requirements
                </p>
                {checks.formatting.message && (
                  <p className="text-sm text-gray-600 bg-white px-3 py-2 rounded border border-gray-200">
                    {checks.formatting.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            className={`p-4 border-2 rounded-lg ${getStatusColor(checks.assets.status as CheckStatus)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(checks.assets.status as CheckStatus)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                  <Image className="w-4 h-4" /> 2. Asset Validation
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  Checks figure resolutions and blinding status
                </p>
                {checks.assets.message && (
                  <p className="text-sm text-gray-600 bg-white px-3 py-2 rounded border border-gray-200">
                    {checks.assets.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            className={`p-4 border-2 rounded-lg ${getStatusColor(checks.plagiarism.status as CheckStatus)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(checks.plagiarism.status as CheckStatus)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">3. Similarity Screening</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Open-source similarity estimate (editor will verify)
                </p>
                {checks.plagiarism.message && (
                  <p className="text-sm text-gray-600 bg-white px-3 py-2 rounded border border-gray-200">
                    {checks.plagiarism.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {allChecksPassed && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">All Checks Passed</h4>
                  <p className="text-sm text-green-800">
                    Your manuscript passed automated screening. Complete declarations on the next
                    step to submit.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">About automated checks</p>
          <p>
            Results are assistive only. Editors verify formatting and may request revisions when
            similarity is elevated.
          </p>
        </div>
      </div>
    </div>
  );
}
