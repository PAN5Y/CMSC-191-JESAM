import { useState } from 'react';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export function AdministrativeCheck() {
  const [declarations, setDeclarations] = useState({
    noCompetingInterests: false,
    ethicalStandards: false,
    dataAvailability: false,
    authorshipContribution: false,
  });

  const handleCheckboxChange = (field: keyof typeof declarations) => {
    setDeclarations(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const allDeclarationsChecked = Object.values(declarations).every(v => v === true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Administrative Check</h2>
        <p className="text-gray-600">
          Final declarations required before submission. Please review and confirm each statement carefully.
        </p>
      </div>

      {/* Declaration Checkboxes */}
      <div className="space-y-4">
        {/* Competing Interests */}
        <div
          className={`p-5 border-2 rounded-lg transition-all ${
            declarations.noCompetingInterests
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={declarations.noCompetingInterests}
                onChange={() => handleCheckboxChange('noCompetingInterests')}
                className="w-5 h-5 border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              {declarations.noCompetingInterests && (
                <CheckCircle2 className="w-5 h-5 text-green-600 absolute pointer-events-none" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">
                No Competing Interests Declaration
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                I declare that I and all co-authors have no competing financial or non-financial interests that could be perceived to bias this work. All potential conflicts have been disclosed in the manuscript.
              </p>
            </div>
          </label>
        </div>

        {/* Ethical Standards */}
        <div
          className={`p-5 border-2 rounded-lg transition-all ${
            declarations.ethicalStandards
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={declarations.ethicalStandards}
                onChange={() => handleCheckboxChange('ethicalStandards')}
                className="w-5 h-5 border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              {declarations.ethicalStandards && (
                <CheckCircle2 className="w-5 h-5 text-green-600 absolute pointer-events-none" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">
                Adherence to Ethical Standards
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                I confirm that this research adheres to all applicable ethical standards, including obtaining informed consent where required, ensuring participant privacy, and complying with institutional and international guidelines for research conduct.
              </p>
            </div>
          </label>
        </div>

        {/* Data Availability */}
        <div
          className={`p-5 border-2 rounded-lg transition-all ${
            declarations.dataAvailability
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={declarations.dataAvailability}
                onChange={() => handleCheckboxChange('dataAvailability')}
                className="w-5 h-5 border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              {declarations.dataAvailability && (
                <CheckCircle2 className="w-5 h-5 text-green-600 absolute pointer-events-none" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">
                Data Availability Statement
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                I confirm that all data supporting the findings of this study are available within the manuscript and/or its supplementary materials, or that data sharing arrangements have been clearly stated and comply with applicable regulations.
              </p>
            </div>
          </label>
        </div>

        {/* Authorship Contribution */}
        <div
          className={`p-5 border-2 rounded-lg transition-all ${
            declarations.authorshipContribution
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={declarations.authorshipContribution}
                onChange={() => handleCheckboxChange('authorshipContribution')}
                className="w-5 h-5 border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              {declarations.authorshipContribution && (
                <CheckCircle2 className="w-5 h-5 text-green-600 absolute pointer-events-none" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">
                Authorship and Contribution
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                I confirm that all listed authors meet authorship criteria, have approved the final manuscript, and agree to be accountable for all aspects of the work. All individuals who made substantial contributions have been included as authors.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Completion Status */}
      {allDeclarationsChecked ? (
        <div className="p-5 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex gap-3">
            <Shield className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-green-900 mb-2">
                Administrative Check Complete
              </h4>
              <p className="text-sm text-green-800 mb-3">
                All required declarations have been confirmed. Your submission is ready for final review and processing.
              </p>
              <div className="space-y-1 text-xs text-green-700">
                <p>✓ Competing interests declared</p>
                <p>✓ Ethical standards confirmed</p>
                <p>✓ Data availability verified</p>
                <p>✓ Authorship criteria met</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-1">Required Declarations</p>
              <p>
                Please review and confirm all declarations above to complete the administrative check. These confirmations are required for submission processing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legal Notice */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Legal Notice</h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          By checking these boxes and submitting this manuscript, you certify that the information provided is accurate and complete to the best of your knowledge. False declarations may result in manuscript rejection, retraction if published, and potential institutional notifications. You acknowledge that you have read and agree to the journal's submission policies and publication ethics guidelines.
        </p>
      </div>

      {/* Information Box */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Why These Declarations Matter</p>
          <p>
            These declarations ensure research integrity, transparency, and compliance with publication ethics. They protect the credibility of the scientific record and help maintain trust in published research.
          </p>
        </div>
      </div>
    </div>
  );
}
