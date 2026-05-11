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
    case 'Initial Screening':
      return 'bg-pink-100 text-pink-800';
    case 'Pending Format Verification':
      return 'bg-sky-100 text-sky-900';
    case 'Editor In Chief Screening':
      return 'bg-pink-100 text-pink-800';
    case 'Production Checks':
      return 'bg-blue-100 text-blue-900';
    case 'For Format Revision':
      return 'bg-amber-100 text-amber-900';
    case 'Peer Review':
      return 'bg-indigo-100 text-indigo-800';
    case 'Editorial Review':
      return 'bg-purple-100 text-purple-800';
    case 'Revision Requested':
      return 'bg-orange-100 text-orange-900';
    case 'Returned to Author':
      return 'bg-amber-100 text-amber-900';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Checking':
      return 'bg-cyan-100 text-cyan-800';
    case 'Accepted':
    case 'In Layout':
    case 'In Production':
      return 'bg-teal-100 text-teal-800';
    case 'Published':
      return 'bg-green-100 text-green-800';
    case 'Return to Revision':
      return 'bg-orange-100 text-orange-900';
    case 'Retracted':
      return 'bg-slate-800 text-white';
    case 'In Layout':
      return 'bg-purple-100 text-purple-800';
    case 'Proofreading':
      return 'bg-teal-100 text-teal-800';
    case 'Author Galley Review':
      return 'bg-orange-100 text-orange-800 ring-2 ring-orange-300';
    case 'Scheduled for Publication':
      return 'bg-indigo-100 text-indigo-800';
    case 'In Issue Management':
      return 'bg-sky-100 text-sky-800';
    case 'Archived':
      return 'bg-stone-100 text-stone-700';
    case 'Declined':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function SubmissionsTable({ manuscripts, onNewSubmission }: SubmissionsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Manuscripts</h3>
          <p className="text-sm text-gray-600">
            Track the status of your submissions and open a manuscript for details.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewSubmission}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Submission
        </button>
      </div>

      <div className="grid gap-3 lg:hidden">
        {manuscripts.map((manuscript) => {
          const ref = manuscript.reference_code ?? manuscript.id.slice(0, 8).toUpperCase();
          const dateStr = new Date(manuscript.created_at).toLocaleDateString();
          const authorsDisplay = manuscript.authors.join(', ');
          const cls = manuscript.classification ?? '—';

          return (
            <article
              key={manuscript.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{ref}</p>
                  <p className="text-xs text-gray-500">{dateStr}</p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(
                    manuscript.classification
                  )}`}
                >
                  {cls}
                </span>
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-medium text-gray-900 break-words">
                  {manuscript.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1 break-words">{authorsDisplay}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span
                  className={`inline-flex w-fit items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    manuscript.status
                  )}`}
                >
                  {manuscript.status}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/author/article/${manuscript.id}`)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-[#3d4a6b] rounded-lg hover:bg-[#4a5875] transition-colors"
                >
                  View details
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-36 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="w-56 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Authors
              </th>
              <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Focus
              </th>
              <th className="w-44 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="w-36 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                  <td className="px-4 py-4 whitespace-nowrap align-top">
                    <div className="text-sm font-medium text-gray-900">{ref}</div>
                    <div className="text-xs text-gray-500">{dateStr}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm text-gray-900 break-words">{manuscript.title}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm text-gray-700 break-words line-clamp-2">{authorsDisplay}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap align-top">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(
                        manuscript.classification
                      )}`}
                    >
                      {cls}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span
                      className={`inline-flex max-w-full items-center px-3 py-1 rounded-full text-xs font-medium whitespace-normal ${getStatusColor(
                        manuscript.status
                      )}`}
                    >
                      {manuscript.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap align-top">
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
