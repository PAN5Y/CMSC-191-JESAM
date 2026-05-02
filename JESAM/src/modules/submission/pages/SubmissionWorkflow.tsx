import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { MetadataForm } from "../components/MetadataForm";
import { AuthorInformation } from "../components/AuthorInformation";
import { AutomatedChecks } from "../components/AutomatedChecks";
import { AdministrativeCheck } from "../components/AdministrativeCheck";
import { SubmissionSuccess } from "../components/SubmissionSuccess";
import { SubmissionWizardProvider, useSubmissionWizard } from "../context/SubmissionWizardContext";
import { useSubmissions } from "../hooks/useSubmissions";
import {
  FileText,
  Users,
  CheckCircle2,
  Shield,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import type { Manuscript } from "@/types";

type WorkflowStep = "metadata" | "authors" | "checks" | "admin" | "success";

function SubmissionWorkflowInner() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("metadata");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Manuscript | null>(null);

  const wizard = useSubmissionWizard();
  const { resetWizard } = wizard;
  const { createManuscript } = useSubmissions();

  const steps = [
    { id: "metadata" as const, title: "Research Metadata", icon: FileText },
    { id: "authors" as const, title: "Author Information", icon: Users },
    { id: "checks" as const, title: "Automated Checks", icon: CheckCircle2 },
    { id: "admin" as const, title: "Author Declarations", icon: Shield },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const canProceed = () => {
    if (currentStep === "metadata") return wizard.isMetadataStepValid;
    if (currentStep === "authors") return wizard.isAuthorsStepValid;
    if (currentStep === "checks") return wizard.isChecksStepValid;
    if (currentStep === "admin") return wizard.isAdminStepValid;
    return false;
  };

  const handleNext = async () => {
    if (currentStep === "metadata") setCurrentStep("authors");
    else if (currentStep === "authors") setCurrentStep("checks");
    else if (currentStep === "checks") setCurrentStep("admin");
    else if (currentStep === "admin") {
      if (!wizard.manuscriptFile) {
        toast.error("Please upload your manuscript file before final submission.");
        return;
      }
      setSubmitting(true);
      const created = await createManuscript({
        metadata: wizard.metadata,
        authors: wizard.authors,
        checks: wizard.checks,
        declarations: wizard.declarations,
        manuscriptFile: wizard.manuscriptFile,
      });
      setSubmitting(false);
      if (created) {
        setSubmitted(created);
        resetWizard();
        setCurrentStep("success");
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep === "authors") setCurrentStep("metadata");
    else if (currentStep === "checks") setCurrentStep("authors");
    else if (currentStep === "admin") setCurrentStep("checks");
  };

  const handleGoToDashboard = () => {
    setSubmitted(null);
    setCurrentStep("metadata");
    navigate("/author");
  };

  const handleViewSubmission = () => {
    if (submitted?.id) {
      navigate(`/author/article/${submitted.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Submit Your Research</h1>
          <p className="text-gray-600 mt-1">
            Follow the steps below to submit your manuscript to JESAM
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                        isActive || isCompleted
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      <StepIcon className="w-6 h-6" />
                    </div>
                    <p
                      className={`text-xs font-medium mt-2 text-center ${
                        isActive || isCompleted ? "text-blue-600" : "text-gray-600"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        isCompleted ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentStep === "metadata" && <MetadataForm />}
        {currentStep === "authors" && <AuthorInformation />}
        {currentStep === "checks" && <AutomatedChecks />}
        {currentStep === "admin" && <AdministrativeCheck />}
        {currentStep === "success" && submitted && (
          <SubmissionSuccess
            referenceCode={submitted.reference_code ?? submitted.id.slice(0, 8).toUpperCase()}
            manuscriptUuid={submitted.id}
            title={submitted.title}
            submittedAt={submitted.created_at}
            onGoToDashboard={handleGoToDashboard}
            onViewSubmission={handleViewSubmission}
          />
        )}

        {currentStep !== "success" && (
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStepIndex === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={!canProceed() || submitting}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : currentStep === "admin" ? (
                "Submit manuscript"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubmissionWorkflow() {
  return (
    <SubmissionWizardProvider>
      <SubmissionWorkflowInner />
    </SubmissionWizardProvider>
  );
}
