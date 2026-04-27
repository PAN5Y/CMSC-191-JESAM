import { useState } from 'react';
import { EditorView } from './EditorView';

type ManuscriptStatus = 'In Submission Queue';

interface Manuscript {
  id: string;
  manuscriptId: string;
  dateSubmitted: string;
  title: string;
  authors: string;
  classification: 'Land' | 'Air' | 'Water' | 'People';
  status: ManuscriptStatus;
}

export function EditorVerificationTable() {
  const [selectedManuscript, setSelectedManuscript] = useState<Manuscript | null>(null);

  // Only manuscripts in "In Submission Queue" status need editor verification
  const manuscripts: Manuscript[] = [
    {
      id: '1',
      manuscriptId: 'JESAM-2026-0-405',
      dateSubmitted: '2026-03-15',
      title: 'Carbon Sequestration Potential of Native Hardwood Species in the ASEAN Region',
      authors: 'Santos, M.A., Reyes, J.P. +1',
      classification: 'Land',
      status: 'In Submission Queue',
    },
    {
      id: '7',
      manuscriptId: 'JESAM-2026-0-428',
      dateSubmitted: '2026-04-05',
      title: 'Impact of Agricultural Runoff on Freshwater Biodiversity',
      authors: 'Villanueva, E.S., Rodriguez, A.M.',
      classification: 'Water',
      status: 'In Submission Queue',
    },
    {
      id: '8',
      manuscriptId: 'JESAM-2026-0-432',
      dateSubmitted: '2026-04-08',
      title: 'Sustainable Land Use Practices in Indigenous Communities',
      authors: 'Fernandez, L.P., Aquino, J.R. +3',
      classification: 'People',
      status: 'In Submission Queue',
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

  const handleApprove = () => {
    alert('Manuscript approved and moved to Administrative Check');
    setSelectedManuscript(null);
  };

  const handleReject = () => {
    alert('Manuscript returned to author for revision');
    setSelectedManuscript(null);
  };

  if (selectedManuscript) {
    return (
      <EditorView
        manuscript={selectedManuscript}
        onBack={() => setSelectedManuscript(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Manuscripts Awaiting Verification</h3>
        <p className="text-sm text-gray-600">
          Review manuscripts in the submission queue and verify automated checks
        </p>
      </div>

      {/* Table */}
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
                Action
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
                  <button
                    onClick={() => setSelectedManuscript(manuscript)}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#3d4a6b] rounded-lg hover:bg-[#4a5875] transition-colors"
                  >
                    Verify Submission →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Card */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">
            {manuscripts.length} manuscripts awaiting verification
          </p>
          <p className="text-blue-800">
            Review automated checks and approve or return manuscripts for revision
          </p>
        </div>
      </div>
    </div>
  );
}
