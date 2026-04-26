import { useState } from 'react';
import { Upload, FileText, Image, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

type CheckStatus = 'pending' | 'checking' | 'passed' | 'failed';

interface CheckResult {
  status: CheckStatus;
  message: string;
}

export function AutomatedChecks() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [checks, setChecks] = useState({
    formatting: { status: 'pending' as CheckStatus, message: '' },
    assets: { status: 'pending' as CheckStatus, message: '' },
    plagiarism: { status: 'pending' as CheckStatus, message: '' },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      runAutomatedChecks(file);
    }
  };

  const runAutomatedChecks = async (file: File) => {
    // Reset checks
    setChecks({
      formatting: { status: 'checking', message: 'Verifying template adherence...' },
      assets: { status: 'pending', message: '' },
      plagiarism: { status: 'pending', message: '' },
    });

    // Simulate formatting check
    await new Promise(resolve => setTimeout(resolve, 1500));
    setChecks(prev => ({
      ...prev,
      formatting: {
        status: 'passed',
        message: 'Template adherence verified. All formatting requirements met.',
      },
      assets: { status: 'checking', message: 'Validating figures and assets...' },
    }));

    // Simulate asset validation
    await new Promise(resolve => setTimeout(resolve, 1500));
    setChecks(prev => ({
      ...prev,
      assets: {
        status: 'passed',
        message: 'All figures meet resolution requirements. Blinding status confirmed.',
      },
      plagiarism: { status: 'checking', message: 'Running plagiarism detection...' },
    }));

    // Simulate plagiarism check
    await new Promise(resolve => setTimeout(resolve, 2000));
    const similarityIndex = Math.floor(Math.random() * 15) + 5; // Random between 5-20%

    if (similarityIndex < 15) {
      setChecks(prev => ({
        ...prev,
        plagiarism: {
          status: 'passed',
          message: `Similarity index: ${similarityIndex}%. Within acceptable threshold. Cleared for administrative check.`,
        },
      }));
    } else {
      setChecks(prev => ({
        ...prev,
        plagiarism: {
          status: 'failed',
          message: `Similarity index: ${similarityIndex}%. Exceeds threshold. Please review and revise overlapping sections.`,
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
          Upload your manuscript for automated validation. The system will verify formatting, assets, and run plagiarism detection.
        </p>
      </div>

      {/* File Upload */}
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
          {uploadedFile ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button className="text-sm text-blue-600 hover:underline">
                Upload different file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                Click to upload manuscript
              </p>
              <p className="text-xs text-gray-500">PDF, DOC, or DOCX (Max 50MB)</p>
            </div>
          )}
        </label>
      </div>

      {/* Automated Checks */}
      {uploadedFile && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Validation Results</h3>

          {/* Formatting Check */}
          <div className={`p-4 border-2 rounded-lg ${getStatusColor(checks.formatting.status)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(checks.formatting.status)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  1. Formatting Check
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
            {checks.formatting.status === 'passed' && (
              <div className="mt-3 ml-8 text-xs text-gray-600">
                <p>✓ Template structure validated</p>
                <p>✓ Section headings verified</p>
                <p>✓ Citation format checked</p>
              </div>
            )}
          </div>

          {/* Asset Validation */}
          <div className={`p-4 border-2 rounded-lg ${getStatusColor(checks.assets.status)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(checks.assets.status)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  2. Asset Validation
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
            {checks.assets.status === 'passed' && (
              <div className="mt-3 ml-8 text-xs text-gray-600">
                <p>✓ Figure resolution ≥ 300 DPI</p>
                <p>✓ Author information removed (blinded)</p>
                <p>✓ File formats validated</p>
              </div>
            )}
          </div>

          {/* Plagiarism Detection */}
          <div className={`p-4 border-2 rounded-lg ${getStatusColor(checks.plagiarism.status)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(checks.plagiarism.status)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  3. Plagiarism Detection
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  Integration with open-source plagiarism detection tools
                </p>
                {checks.plagiarism.message && (
                  <p className="text-sm text-gray-600 bg-white px-3 py-2 rounded border border-gray-200">
                    {checks.plagiarism.message}
                  </p>
                )}
              </div>
            </div>
            {checks.plagiarism.status === 'failed' && (
              <div className="mt-3 ml-8">
                <p className="text-sm text-red-700 font-medium mb-2">Action Required:</p>
                <ul className="text-xs text-red-600 space-y-1">
                  <li>• Review sections with high similarity</li>
                  <li>• Ensure proper citations and quotations</li>
                  <li>• Revise overlapping content</li>
                  <li>• Resubmit for validation</li>
                </ul>
              </div>
            )}
          </div>

          {/* Editor Verification Note */}
          {allChecksPassed && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">
                    All Checks Passed
                  </h4>
                  <p className="text-sm text-green-800">
                    Your manuscript has passed all automated checks and will be verified by the corresponding Editor before proceeding to the Administrative Check.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Information */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">About Automated Checks</p>
          <p>
            These automated validations ensure your manuscript meets technical requirements before editorial review. The corresponding Editor will verify formatting compliance, and manuscripts with high similarity indices will be returned for revision before proceeding.
          </p>
        </div>
      </div>
    </div>
  );
}
