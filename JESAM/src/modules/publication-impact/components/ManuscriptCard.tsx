import { useNavigate } from "react-router";
import { CheckCircle2, FileText, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Manuscript } from "../types";
import StatusBadge from "@/components/common/StatusBadge";
import ClassificationBadge from "@/components/common/ClassificationBadge";
import MetricCard from "@/components/common/MetricCard";

interface ManuscriptCardProps {
  manuscript: Manuscript;
}

export default function ManuscriptCard({ manuscript }: ManuscriptCardProps) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAuthor = role === "author";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-['Newsreader',serif] text-[20px] text-[#1a1c1c] mb-2">
            {manuscript.title}
          </h3>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mb-3">
            {manuscript.authors.join(", ")}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
              ID: {manuscript.id.slice(0, 8)}...
            </span>
            <span className="text-xs text-[#9e9e9e]">•</span>
            <span className="text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
              Submitted: {new Date(manuscript.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ClassificationBadge classification={manuscript.classification} />
          <StatusBadge status={manuscript.status} />
        </div>
      </div>

      {/* Publication Progress */}
      <div className="mb-4 p-4 bg-[#f5f5f5] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif]">
            Publication Progress
          </span>
          {manuscript.status === "Published" && (
            <span className="text-xs text-[#3f4b7e] font-['Public_Sans',sans-serif] flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              Complete
            </span>
          )}
        </div>
        <div className="space-y-2">
          {[
            { label: "Manuscript Accepted", done: true },
            { label: "Files Prepared", done: !!manuscript.file_url },
            {
              label: "DOI Assigned",
              done: !!manuscript.doi,
              extra: manuscript.doi,
            },
            {
              label: "Published Online",
              done: manuscript.status === "Published",
            },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              {step.done ? (
                <CheckCircle2 className="size-4 text-[#3f4b7e]" />
              ) : (
                <div className="size-4 border-2 border-[#e0e0e0] rounded-full" />
              )}
              <span
                className={`text-sm font-['Public_Sans',sans-serif] ${
                  step.done ? "text-[#1a1c1c]" : "text-[#9e9e9e]"
                }`}
              >
                {step.label}
              </span>
              {step.extra && (
                <span className="text-xs text-[#3f4b7e] font-['Public_Sans',sans-serif]">
                  {step.extra}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Metrics (if published) */}
      {manuscript.status === "Published" && manuscript.metrics && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <MetricCard value={manuscript.metrics.views} label="Views" />
          <MetricCard value={manuscript.metrics.downloads} label="Downloads" />
          <MetricCard
            value={manuscript.metrics.citations}
            label="Citations"
            highlight
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(isAuthor ? `/author/article/${manuscript.id}` : `/article/${manuscript.id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-[#3f4b7e] text-white text-sm font-['Public_Sans',sans-serif] rounded hover:bg-[#3f4b7e]/90 transition-colors"
        >
          <FileText className="size-4" />
          View Details
        </button>
        {manuscript.status === "Published" && (
          <button
            onClick={() => navigate(`/article/public/${manuscript.id}`)}
            className="flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-[#1a1c1c] text-sm font-['Public_Sans',sans-serif] rounded hover:bg-[#f5f5f5] transition-colors"
          >
            <Globe className="size-4" />
            View Published Article
          </button>
        )}
      </div>
    </div>
  );
}
