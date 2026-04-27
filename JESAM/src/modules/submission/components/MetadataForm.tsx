import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export function MetadataForm() {
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    keywords: '',
    focus: '',
    subjectArea: '',
    funding: '',
    competingInterests: '',
    ethicalApprovals: '',
  });

  const focusOptions = ['Land', 'Air', 'Water', 'People'];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Research Metadata</h2>
        <p className="text-gray-600">
          Provide essential information about your research submission. All fields are required for automated indexing and transparency.
        </p>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter the title of your research paper"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
        />
      </div>

      {/* Abstract */}
      <div>
        <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-2">
          Abstract <span className="text-red-500">*</span>
        </label>
        <textarea
          id="abstract"
          value={formData.abstract}
          onChange={(e) => handleChange('abstract', e.target.value)}
          placeholder="Provide a comprehensive abstract of your research (250-300 words recommended)"
          rows={6}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
        />
        <p className="mt-1 text-sm text-gray-500">{formData.abstract.length} characters</p>
      </div>

      {/* Keywords */}
      <div>
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
          Keywords <span className="text-red-500">*</span>
        </label>
        <input
          id="keywords"
          type="text"
          value={formData.keywords}
          onChange={(e) => handleChange('keywords', e.target.value)}
          placeholder="Enter keywords separated by commas (e.g., climate change, sustainability, ecosystem)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
        />
        <p className="mt-1 text-sm text-gray-500">Separate keywords with commas</p>
      </div>

      {/* Focus of the Paper */}
      <div>
        <label htmlFor="focus" className="block text-sm font-medium text-gray-700 mb-2">
          Focus of the Paper <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {focusOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleChange('focus', option)}
              className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                formData.focus === option
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Area */}
      <div>
        <label htmlFor="subjectArea" className="block text-sm font-medium text-gray-700 mb-2">
          Subject Area <span className="text-red-500">*</span>
        </label>
        <select
          id="subjectArea"
          value={formData.subjectArea}
          onChange={(e) => handleChange('subjectArea', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
        >
          <option value="">Select a subject area</option>
          <option value="environmental-science">Environmental Science</option>
          <option value="ecology">Ecology</option>
          <option value="climatology">Climatology</option>
          <option value="marine-biology">Marine Biology</option>
          <option value="conservation">Conservation Biology</option>
          <option value="sustainability">Sustainability Studies</option>
          <option value="geography">Geography</option>
          <option value="atmospheric-science">Atmospheric Science</option>
        </select>
      </div>

      {/* Funding Information */}
      <div>
        <label htmlFor="funding" className="block text-sm font-medium text-gray-700 mb-2">
          Funding Information <span className="text-red-500">*</span>
        </label>
        <textarea
          id="funding"
          value={formData.funding}
          onChange={(e) => handleChange('funding', e.target.value)}
          placeholder="Provide details of funding sources, grant numbers, and sponsors. If no funding was received, please state 'No funding received.'"
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
        />
      </div>

      {/* Competing Interests */}
      <div>
        <label htmlFor="competingInterests" className="block text-sm font-medium text-gray-700 mb-2">
          Competing Interests <span className="text-red-500">*</span>
        </label>
        <textarea
          id="competingInterests"
          value={formData.competingInterests}
          onChange={(e) => handleChange('competingInterests', e.target.value)}
          placeholder="Declare any competing interests. If none, please state 'The authors declare no competing interests.'"
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
        />
      </div>

      {/* Ethical Approvals */}
      <div>
        <label htmlFor="ethicalApprovals" className="block text-sm font-medium text-gray-700 mb-2">
          Ethical Approvals <span className="text-red-500">*</span>
        </label>
        <textarea
          id="ethicalApprovals"
          value={formData.ethicalApprovals}
          onChange={(e) => handleChange('ethicalApprovals', e.target.value)}
          placeholder="Provide details of ethical approvals obtained (e.g., IRB approval numbers, animal ethics committee approvals). If not applicable, please state 'Not applicable.'"
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
        />
      </div>

      {/* Information Note */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Why this information is required</p>
          <p>
            This metadata ensures transparency in research and facilitates automated indexing by academic databases. Accurate information helps other researchers discover and cite your work.
          </p>
        </div>
      </div>
    </div>
  );
}
