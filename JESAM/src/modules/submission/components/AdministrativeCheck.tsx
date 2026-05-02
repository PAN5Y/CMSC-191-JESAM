import { Shield, CheckCircle2 } from "lucide-react";
import { useSubmissionWizard } from "../context/SubmissionWizardContext";

export function AdministrativeCheck() {
  const { declarations, setDeclarations } = useSubmissionWizard();

  const handleCheckboxChange = (field: keyof typeof declarations) => {
    setDeclarations((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Author Declarations</h2>
        <p className="text-gray-600">
          Final author confirmations required before submission to Editor-in-Chief screening.
          Please review and confirm each statement carefully.
        </p>
      </div>

      <div className="space-y-4">
        <div
          className={`p-5 border-2 rounded-lg transition-all ${
            declarations.noCompetingInterests
              ? "border-green-300 bg-green-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={declarations.noCompetingInterests}
                onChange={() => handleCheckboxChange("noCompetingInterests")}
                className="w-5 h-5 border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              {declarations.noCompetingInterests && (
                <CheckCircle2 className="w-5 h-5 text-green-600 absolute pointer-events-none" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">No Competing Interests Declaration</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                I declare that I and all co-authors have no competing financial or non-financial interests that could be perceived to bias this work.
              </p>
            </div>
          </label>
        </div>

        <div
          className={`p-5 border-2 rounded-lg transition-all ${
            declarations.ethicalStandards
              ? "border-green-300 bg-green-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={declarations.ethicalStandards}
                onChange={() => handleCheckboxChange("ethicalStandards")}
                className="w-5 h-5 border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              {declarations.ethicalStandards && (
                <CheckCircle2 className="w-5 h-5 text-green-600 absolute pointer-events-none" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">Ethical Standards</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                I certify that this research was conducted in accordance with ethical guidelines and institutional requirements.
              </p>
            </div>
          </label>
        </div>

        <div
          className={`p-5 border-2 rounded-lg transition-all ${
            declarations.dataAvailability
              ? "border-green-300 bg-green-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={declarations.dataAvailability}
                onChange={() => handleCheckboxChange("dataAvailability")}
                className="w-5 h-5 border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              {declarations.dataAvailability && (
                <CheckCircle2 className="w-5 h-5 text-green-600 absolute pointer-events-none" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">Data Availability</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                I confirm that data availability statements are accurate and that data will be made available as described in the manuscript.
              </p>
            </div>
          </label>
        </div>

        <div
          className={`p-5 border-2 rounded-lg transition-all ${
            declarations.authorshipContribution
              ? "border-green-300 bg-green-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={declarations.authorshipContribution}
                onChange={() => handleCheckboxChange("authorshipContribution")}
                className="w-5 h-5 border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              {declarations.authorshipContribution && (
                <CheckCircle2 className="w-5 h-5 text-green-600 absolute pointer-events-none" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">Authorship Contribution</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                All authors listed have made substantial contributions and approve the manuscript for submission.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <Shield className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-700">
          By checking these boxes and submitting, you certify the information is accurate. False declarations may result in rejection or retraction.
        </p>
      </div>
    </div>
  );
}
