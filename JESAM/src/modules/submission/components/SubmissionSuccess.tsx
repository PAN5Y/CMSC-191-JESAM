import { CheckCircle2, Info, FileText, Mail } from 'lucide-react';

interface SubmissionSuccessProps {
  onGoToDashboard: () => void;
  onViewSubmission: () => void;
}

export function SubmissionSuccess({ onGoToDashboard, onViewSubmission }: SubmissionSuccessProps) {
  // Generate manuscript ID based on current date
  const today = new Date();
  const year = today.getFullYear();
  const manuscriptId = `JESAM-${year}-0-${Math.floor(Math.random() * 900) + 100}`;
  const dateSubmitted = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const progressSteps = [
    {
      id: 1,
      title: 'Submitted',
      status: 'completed',
      date: dateSubmitted,
    },
    {
      id: 2,
      title: 'Screening',
      status: 'pending',
      description: 'Awaiting editor review',
    },
    {
      id: 3,
      title: 'Peer Review',
      status: 'not-started',
      description: 'Not yet started',
    },
    {
      id: 4,
      title: 'Publication',
      status: 'not-started',
      description: 'Not yet started',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Success Icon and Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Submission Successful</h2>
          <p className="text-gray-600">
            Your manuscript has been successfully submitted to JESAM.
          </p>
        </div>

        {/* Manuscript Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Manuscript ID</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{manuscriptId}</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Submitted
              </span>
            </div>
          </div>

          <div className="pb-2">
            <p className="text-sm text-gray-600 mb-1">Title</p>
            <p className="text-base text-gray-900 font-medium">
              Sustainable Water Management Practices in Urban Agricultural Systems
            </p>
          </div>

          <div className="pb-2">
            <p className="text-sm text-gray-600 mb-1">Date Submitted</p>
            <p className="text-base text-gray-900">{dateSubmitted}</p>
          </div>
        </div>

        {/* Current Status */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Current Status</h4>
              <p className="text-sm text-blue-800">Submitted - Awaiting Screening</p>
            </div>
          </div>
        </div>

        {/* Submission Progress */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Submission Progress</h4>
          <div className="space-y-4">
            {progressSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {step.status === 'completed' ? (
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className={`text-sm font-medium ${
                      step.status === 'completed' ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {step.title}
                    </h5>
                    {step.date && (
                      <span className="text-xs text-gray-500">{step.date}</span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Confirmation */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onGoToDashboard}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#3d4a6b] text-white rounded-lg font-medium hover:bg-[#4a5875] transition-colors"
          >
            <FileText className="w-4 h-4" />
            Go to Dashboard
          </button>
          <button
            onClick={onViewSubmission}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            View Submission
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          You can track your manuscript status anytime from your dashboard.
        </p>
      </div>
    </div>
  );
}
