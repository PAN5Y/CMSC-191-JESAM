import { useNavigate } from "react-router";
import type { Manuscript } from "../types";
import StatusBadge from "@/components/common/StatusBadge";
import ClassificationBadge from "@/components/common/ClassificationBadge";

interface ManuscriptTableProps {
  manuscripts: Manuscript[];
}

export default function ManuscriptTable({ manuscripts }: ManuscriptTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#f5f5f5] border-b border-[#e0e0e0]">
          <tr>
            {["Manuscript ID", "Title", "Authors", "Classification", "Status", "Action"].map(
              (header) => (
                <th
                  key={header}
                  className={`text-left px-6 py-4 text-xs font-['Public_Sans',sans-serif] uppercase tracking-wider text-[#6b7280] ${
                    header === "Status" ? "w-40" : ""
                  }`}
                >
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e0e0e0]">
          {manuscripts.map((manuscript) => (
            <tr
              key={manuscript.id}
              className="hover:bg-[#f5f5f5] transition-colors"
            >
              <td className="px-6 py-4">
                <div className="text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c]">
                  {manuscript.id.slice(0, 8)}...
                </div>
                <div className="text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
                  {new Date(manuscript.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-['Newsreader',serif] text-[#1a1c1c] max-w-md">
                  {manuscript.title}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-['Public_Sans',sans-serif] text-[#6b7280]">
                  {manuscript.authors.slice(0, 2).join(", ")}
                  {manuscript.authors.length > 2 &&
                    ` +${manuscript.authors.length - 2}`}
                </div>
              </td>
              <td className="px-6 py-4">
                <ClassificationBadge
                  classification={manuscript.classification}
                />
              </td>
              <td className="px-6 py-4 w-40">
                <StatusBadge status={manuscript.status} />
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => navigate(`/article/${manuscript.id}`)}
                  className="px-4 py-2 bg-[#3f4b7e] text-white text-sm font-['Public_Sans',sans-serif] rounded hover:bg-[#3f4b7e]/90 transition-colors"
                >
                  Proceed to Publication →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
