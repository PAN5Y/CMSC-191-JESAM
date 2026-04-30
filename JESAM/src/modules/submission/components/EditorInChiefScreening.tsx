import { useState } from "react";
import { Info } from "lucide-react";
import type { Manuscript } from "@/types";
import { ManuscriptDetailsModal } from "./ManuscriptDetailsModal";
import type { ScreeningDecision } from "../types";

interface EditorInChiefScreeningProps {
  manuscripts: Manuscript[];
  decidedBy: string;
  onScreeningSubmit: (decision: ScreeningDecision) => Promise<void>;
}

export function EditorInChiefScreening({
  manuscripts,
  decidedBy,
  onScreeningSubmit,
}: EditorInChiefScreeningProps) {
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

  const getSimilarityColor = (similarity: number) => {
    if (similarity <= 15) return "text-green-700";
    if (similarity <= 30) return "text-yellow-700";
    return "text-red-700";
  };

  const similarityOf = (m: Manuscript) =>
    typeof m.submission_metadata?.similarity_score === "number"
      ? m.submission_metadata.similarity_score
      : 0;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Editor screening process</h4>
            <p className="text-sm text-blue-800">
              Editor-in-Chief can desk-reject immediately (including new submissions in queue), while editor technical verification routes manuscripts into this screening stage.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manuscripts for screening</h3>
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
                  Similarity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {manuscripts.map((manuscript) => {
                const ref = manuscript.reference_code ?? manuscript.id.slice(0, 8).toUpperCase();
                const sim = similarityOf(manuscript);
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
                      <span className={`text-sm font-semibold ${getSimilarityColor(sim)}`}>{sim}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedManuscript(manuscript)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          View details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedManuscript && (
        <ManuscriptDetailsModal
          manuscript={selectedManuscript}
          decidedBy={decidedBy}
          onClose={() => setSelectedManuscript(null)}
          onSubmitScreening={async (decision) => {
            await onScreeningSubmit(decision);
            setSelectedManuscript(null);
          }}
        />
      )}
    </div>
  );
}
