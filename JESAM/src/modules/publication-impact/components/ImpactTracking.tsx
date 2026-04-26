import { RefreshCw, Eye, Download, BookOpen } from "lucide-react";
import MetricCard from "@/components/common/MetricCard";
import type { ManuscriptMetrics } from "../types";

interface ImpactTrackingProps {
  metrics: ManuscriptMetrics;
  onRefresh: () => void;
}

export default function ImpactTracking({
  metrics,
  onRefresh,
}: ImpactTrackingProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-['Newsreader',serif] text-[24px] text-[#1a1c1c] leading-[32px]">
            Impact Analytics
          </h3>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mt-1">
            Real-time article performance from Supabase
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] rounded text-sm text-[#3f4b7e] font-['Public_Sans',sans-serif] hover:bg-[#e8eaf6] transition-colors"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          icon={Eye}
          label="Views"
          value={metrics.views.toLocaleString()}
          color="#3f4b7e"
        />
        <MetricCard
          icon={Download}
          label="Downloads"
          value={metrics.downloads.toLocaleString()}
          color="#F5C344"
        />
        <MetricCard
          icon={BookOpen}
          label="Citations"
          value={metrics.citations.toLocaleString()}
          color="#2e7d32"
        />
      </div>
      {metrics.last_updated && (
        <p className="mt-4 text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif] text-right">
          Last updated: {new Date(metrics.last_updated).toLocaleString()}
        </p>
      )}
    </div>
  );
}
