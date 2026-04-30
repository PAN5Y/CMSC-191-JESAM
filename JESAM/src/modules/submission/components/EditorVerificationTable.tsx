import { useState } from "react";
import type { Manuscript } from "@/types";
import { EditorView } from "./EditorView";

interface EditorVerificationTableProps {
  manuscripts: Manuscript[];
  onApprove: (id: string) => Promise<void>;
  onReturnToAuthor: (id: string, comments: string) => Promise<void>;
}

export function EditorVerificationTable({
  manuscripts,
  onApprove,
  onReturnToAuthor,
}: EditorVerificationTableProps) {
  const [selectedManuscript, setSelectedManuscript] = useState<Manuscript | null>(null);

  const getClassificationColor = (classification: string | null) => {
    switch (classification) {
      case "Land":
        return "bg-amber-100 text-amber-800";
      case "Air":
        return "bg-cyan-100 text-cyan-800";
      case "Water":
        return "bg-blue-100 text-blue-800";
      case "People":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (selectedManuscript) {
    return (
      <EditorView
        manuscript={selectedManuscript}
        onBack={() => setSelectedManuscript(null)}
        onApprove={async () => {
          await onApprove(selectedManuscript.id);
          setSelectedManuscript(null);
        }}
        onReject={async (comments) => {
          await onReturnToAuthor(selectedManuscript.id, comments);
          setSelectedManuscript(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Manuscripts awaiting verification</h3>
        <p className="text-sm text-gray-600">
          Review automated checks and approve or return manuscripts to the author.
        </p>
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
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {manuscripts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                  No manuscripts in the submission queue.
                </td>
              </tr>
            ) : (
              manuscripts.map((manuscript) => {
                const ref = manuscript.reference_code ?? manuscript.id.slice(0, 8).toUpperCase();
                const dateStr = new Date(manuscript.created_at).toLocaleDateString();
                const authorsDisplay = manuscript.authors.join(", ");
                const cls = manuscript.classification ?? "—";

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
                      <button
                        type="button"
                        onClick={() => setSelectedManuscript(manuscript)}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#3d4a6b] rounded-lg hover:bg-[#4a5875] transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {manuscripts.length > 0 && (
        <p className="text-sm text-gray-500">{manuscripts.length} manuscript(s) awaiting verification</p>
      )}
    </div>
  );
}
