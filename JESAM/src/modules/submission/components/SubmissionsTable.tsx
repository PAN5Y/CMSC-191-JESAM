import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Manuscript, ManuscriptStatus } from '@/types';

interface SubmissionsTableProps {
  manuscripts: Manuscript[];
  onNewSubmission: () => void;
}

function getClassificationColor(classification: string | null) {
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
}

function getStatusColor(status: ManuscriptStatus) {
  switch (status) {
    case 'Pending Format Verification':
      return 'bg-sky-100 text-sky-900';
    case 'Editor In Chief Screening':
      return 'bg-pink-100 text-pink-800';
    case 'Peer Review':
      return 'bg-indigo-100 text-indigo-800';
    case 'Revision Requested':
      return 'bg-orange-100 text-orange-900';
    case 'Returned to Author':
      return 'bg-amber-100 text-amber-900';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Accepted':
    case 'In Production':
      return 'bg-teal-100 text-teal-800';
    case 'Published':
      return 'bg-green-100 text-green-800';
    case 'Return to Revision':
      return 'bg-orange-100 text-orange-900';
    case 'Retracted':
      return 'bg-slate-800 text-white';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function SubmissionsTable({ manuscripts, onNewSubmission }: SubmissionsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Manuscripts</h3>
          <p className="text-sm text-gray-600">
            Track the status of your submissions and open a manuscript for details.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Authors
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Focus
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
            {manuscripts.map((manuscript) => {
              const ref = manuscript.reference_code ?? manuscript.id.slice(0, 8).toUpperCase();
              const dateStr = new Date(manuscript.created_at).toLocaleDateString();
              const authorsDisplay = manuscript.authors.join(', ');
              const cls = manuscript.classification ?? '—';

              return (
                <tr key={manuscript.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ref}</div>
                    <div className="text-xs text-gray-500">{dateStr}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md">{manuscript.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-xs truncate">{authorsDisplay}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(
                        manuscript.classification
                      )}`}
                    >
                      {cls}
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
                    <button
                      type="button"
                      onClick={() => navigate(`/author/article/${manuscript.id}`)}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#3d4a6b] rounded-lg hover:bg-[#4a5875] transition-colors"
                    >
                      View details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">{manuscripts.length} manuscript(s)</p>
          <p className="text-blue-800">Data loaded from your account in JESAM.</p>
        </div>
      </div>
    </div>
  );
}
