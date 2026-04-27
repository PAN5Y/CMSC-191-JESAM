import { useState } from 'react';
import { MetadataForm } from '../components/MetadataForm';
import { AuthorInformation } from '../components/AuthorInformation';
import { AutomatedChecks } from '../components/AutomatedChecks';
import { AdministrativeCheck } from '../components/AdministrativeCheck';
import { SubmissionSuccess } from '../components/SubmissionSuccess';
import {
  FileText,
  Users,
  CheckCircle2,
  Shield,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

type WorkflowStep = 'metadata' | 'authors' | 'checks' | 'admin' | 'success';

export default function SubmissionWorkflow() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('metadata');

  const steps = [
    { id: 'metadata' as const, title: 'Research Metadata', icon: FileText },
    { id: 'authors' as const, title: 'Author Information', icon: Users },
    { id: 'checks' as const, title: 'Automated Checks', icon: CheckCircle2 },
    { id: 'admin' as const, title: 'Administrative Check', icon: Shield },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    if (currentStep === 'metadata') setCurrentStep('authors');
    else if (currentStep === 'authors') setCurrentStep('checks');
    else if (currentStep === 'checks') setCurrentStep('admin');
    else if (currentStep === 'admin') setCurrentStep('success');
  };

  const handlePrevious = () => {
    if (currentStep === 'authors') setCurrentStep('metadata');
    else if (currentStep === 'checks') setCurrentStep('authors');
    else if (currentStep === 'admin') setCurrentStep('checks');
  };

  const handleGoToDashboard = () => {
    setCurrentStep('metadata');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Submit Your Research</h1>
          <p className="text-gray-600 mt-1">
            Follow the steps below to submit your manuscript to JESAM
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const stepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                        isActive || isCompleted
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {stepIcon && <stepIcon className="w-6 h-6" />}
                    </div>
                    <p
                      className={`text-xs font-medium mt-2 text-center ${
                        isActive || isCompleted ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        isCompleted ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentStep === 'metadata' && <MetadataForm />}
        {currentStep === 'authors' && <AuthorInformation />}
        {currentStep === 'checks' && <AutomatedChecks />}
        {currentStep === 'admin' && <AdministrativeCheck />}
        {currentStep === 'success' && (
          <SubmissionSuccess
            onGoToDashboard={handleGoToDashboard}
            onViewSubmission={() => {}}
          />
        )}

        {/* Navigation Buttons */}
        {currentStep !== 'success' && (
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStepIndex === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
