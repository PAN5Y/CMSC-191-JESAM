import { Plus } from 'lucide-react';

type ManuscriptStatus =
  | 'Awaiting Assignment'
  | 'In Submission Queue'
  | 'In Review'
  | 'Peer Review in Progress'
  | 'Awaiting Decision'
  | 'Revisions Required'
  | 'In Editing'
  | 'Copyediting'
  | 'In Layout'
  | 'Proofreading'
  | 'Author Galley Review'
  | 'Scheduled for Publication'
  | 'In Issue Management'
  | 'Published'
  | 'Archived'
  | 'Declined';

interface Manuscript {
  id: string;
  manuscriptId: string;
  dateSubmitted: string;
  title: string;
  authors: string;
  classification: 'Land' | 'Air' | 'Water' | 'People';
  status: ManuscriptStatus;
}

interface SubmissionsTableProps {
  onNewSubmission: () => void;
}

export function SubmissionsTable({ onNewSubmission }: SubmissionsTableProps) {
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
      id: '2',
      manuscriptId: 'JESAM-2026-0-398',
      dateSubmitted: '2026-03-08',
      title: 'Microplastic Contamination in Coastal Waters of Manila Bay',
      authors: 'Garcia, L.M., Tan, S.Y.',
      classification: 'Water',
      status: 'Peer Review in Progress',
    },
    {
      id: '3',
      manuscriptId: 'JESAM-2026-0-387',
      dateSubmitted: '2026-02-28',
      title: 'Urban Heat Island Effect in Metro Manila: A Remote Sensing Approach',
      authors: 'Cruz, R.D., Lim, K.W. +1',
      classification: 'Air',
      status: 'Published',
    },
    {
      id: '4',
      manuscriptId: 'JESAM-2026-0-412',
      dateSubmitted: '2026-03-22',
      title: 'Biodiversity Assessment of Mangrove Ecosystems in Southern Philippines',
      authors: 'Reyes, M.C., Santos, D.L.',
      classification: 'Land',
      status: 'Copyediting',
    },
    {
      id: '5',
      manuscriptId: 'JESAM-2026-0-421',
      dateSubmitted: '2026-04-01',
      title: 'Community-Based Forest Management and Local Livelihoods',
      authors: 'Domingo, A.B., Cruz, M.T. +2',
      classification: 'People',
      status: 'Awaiting Assignment',
    },
    {
      id: '6',
      manuscriptId: 'JESAM-2026-0-415',
      dateSubmitted: '2026-03-28',
      title: 'Assessment of Air Quality Index in Urban Centers',
      authors: 'Martinez, P.L., Gonzales, R.F.',
      classification: 'Air',
      status: 'Revisions Required',
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

  const getStatusColor = (status: ManuscriptStatus) => {
    switch (status) {
      case 'Awaiting Assignment':
        return 'bg-gray-100 text-gray-800';
      case 'In Submission Queue':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Review':
        return 'bg-blue-100 text-blue-800';
      case 'Peer Review in Progress':
        return 'bg-indigo-100 text-indigo-800';
      case 'Awaiting Decision':
        return 'bg-purple-100 text-purple-800';
      case 'Revisions Required':
        return 'bg-orange-100 text-orange-800';
      case 'In Editing':
        return 'bg-cyan-100 text-cyan-800';
      case 'Copyediting':
        return 'bg-teal-100 text-teal-800';
      case 'In Layout':
        return 'bg-lime-100 text-lime-800';
      case 'Proofreading':
        return 'bg-emerald-100 text-emerald-800';
      case 'Author Galley Review':
        return 'bg-amber-100 text-amber-800';
      case 'Scheduled for Publication':
        return 'bg-sky-100 text-sky-800';
      case 'In Issue Management':
        return 'bg-violet-100 text-violet-800';
      case 'Published':
        return 'bg-green-100 text-green-800';
      case 'Archived':
        return 'bg-slate-100 text-slate-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Manuscripts</h3>
          <p className="text-sm text-gray-600">Track the publication status of your submitted manuscripts</p>
        </div>
        <button
          onClick={onNewSubmission}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#3d4a6b] text-white rounded-lg font-medium hover:bg-[#4a5875] transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Submission
        </button>
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
                Status
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
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      manuscript.status
                    )}`}
                  >
                    {manuscript.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {manuscript.status === 'Published' || manuscript.status === 'Archived' || manuscript.status === 'Declined' ? (
                    <button className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed">
                      {manuscript.status}
                    </button>
                  ) : (
                    <button className="px-4 py-2 text-sm font-medium text-white bg-[#3d4a6b] rounded-lg hover:bg-[#4a5875] transition-colors">
                      View Details →
                    </button>
                  )}
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
            {manuscripts.length} manuscripts
          </p>
          <p className="text-blue-800">
            Last updated April 12, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
