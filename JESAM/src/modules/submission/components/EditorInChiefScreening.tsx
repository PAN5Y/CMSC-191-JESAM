import { useState } from 'react';
import { Info } from 'lucide-react';
import { ManuscriptDetailsModal } from './ManuscriptDetailsModal';

interface Manuscript {
  id: string;
  manuscriptId: string;
  dateSubmitted: string;
  title: string;
  authors: string;
  classification: 'Land' | 'Air' | 'Water' | 'People';
  similarity: number;
  abstract: string;
  formattingStatus: 'Passed' | 'Failed';
}

export function EditorInChiefScreening() {
  const [selectedManuscript, setSelectedManuscript] = useState<Manuscript | null>(null);

  const manuscripts: Manuscript[] = [
    {
      id: '1',
      manuscriptId: 'MS-2026-047',
      dateSubmitted: '2026-04-10',
      title: 'Sustainable Water Management Practices in Urban Agricultural Systems',
      authors: 'Chen, L., Martinez, R., Anderson, K.',
      classification: 'Water',
      similarity: 12,
      abstract: 'This study investigates innovative water conservation techniques implemented in urban farming environments across three metropolitan regions...',
      formattingStatus: 'Passed',
    },
    {
      id: '2',
      manuscriptId: 'MS-2026-048',
      dateSubmitted: '2026-04-11',
      title: 'Land Degradation Assessment Using Remote Sensing: A Multi-Temporal Analysis',
      authors: 'Okonkwo, A., Yamamoto, H.',
      classification: 'Land',
      similarity: 8,
      abstract: 'Using satellite imagery and GIS technology, this research analyzes land degradation patterns across agricultural regions in Southeast Asia...',
      formattingStatus: 'Passed',
    },
    {
      id: '3',
      manuscriptId: 'MS-2026-049',
      dateSubmitted: '2026-04-11',
      title: 'Community Participation in Resource Management: Case Studies from Southeast Asia',
      authors: 'Nguyen, T., Patel, S., Fernandez, M.',
      classification: 'People',
      similarity: 24,
      abstract: 'This paper examines the role of local communities in sustainable resource management through comparative case studies...',
      formattingStatus: 'Passed',
    },
    {
      id: '4',
      manuscriptId: 'MS-2026-050',
      dateSubmitted: '2026-04-12',
      title: 'Hydrological Impacts of Climate Variability on Watershed Ecosystems',
      authors: 'Larsson, E., Kim, J.',
      classification: 'Water',
      similarity: 6,
      abstract: 'An analysis of how climate change affects water availability and quality in critical watershed regions...',
      formattingStatus: 'Passed',
    },
    {
      id: '5',
      manuscriptId: 'MS-2026-051',
      dateSubmitted: '2026-04-13',
      title: 'Soil Carbon Sequestration in Restored Grassland Ecosystems',
      authors: 'Thompson, B., Rivera, C., Dubois, A.',
      classification: 'Land',
      similarity: 15,
      abstract: 'This study quantifies carbon sequestration rates in grassland restoration projects across temperate regions...',
      formattingStatus: 'Passed',
    },
  ];

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

  const getSimilarityColor = (similarity: number) => {
    if (similarity < 15) return 'text-green-700';
    if (similarity < 25) return 'text-yellow-700';
    return 'text-red-700';
  };

  const handleQuickReject = (manuscript: Manuscript) => {
    alert(`Quick reject: ${manuscript.manuscriptId}`);
  };

  const handleProceedToReview = (manuscript: Manuscript) => {
    alert(`Proceeding to review: ${manuscript.manuscriptId}`);
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Editor Screening Process</h4>
            <p className="text-sm text-blue-800">
              Editor-in-Chief can reject submissions at the screening stage before peer review if they do not align with JESAM's scope or standards.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">New Manuscripts for Screening</h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Manuscript ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Authors
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Similarity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {manuscripts.map((manuscript) => (
                <tr key={manuscript.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {manuscript.manuscriptId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {manuscript.dateSubmitted}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md">
                      {manuscript.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">
                      {manuscript.authors}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(
                        manuscript.classification
                      )}`}
                    >
                      {manuscript.classification}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${getSimilarityColor(manuscript.similarity)}`}>
                      {manuscript.similarity}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedManuscript(manuscript)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleQuickReject(manuscript)}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded hover:bg-red-50 transition-colors"
                      >
                        Quick Reject
                      </button>
                      <button
                        onClick={() => handleProceedToReview(manuscript)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-[#3d4a6b] rounded hover:bg-[#4a5875] transition-colors"
                      >
                        Proceed to Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manuscript Details Modal */}
      {selectedManuscript && (
        <ManuscriptDetailsModal
          manuscript={selectedManuscript}
          onClose={() => setSelectedManuscript(null)}
        />
      )}
    </div>
  );
}
