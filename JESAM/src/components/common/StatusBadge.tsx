import type { ManuscriptStatus } from "@/modules/publication-impact/types";

const statusConfig: Record<ManuscriptStatus, { bg: string; text: string; label: string }> = {
  Accepted: {
    bg: "bg-[#e8f5e9]",
    text: "text-[#2e7d32]",
    label: "Accepted",
  },
  "In Production": {
    bg: "bg-[#fff8e1]",
    text: "text-[#f57c00]",
    label: "In Production",
  },
  Published: {
    bg: "bg-[#e8eaf6]",
    text: "text-[#3f4b7e]",
    label: "Published",
  },
  "Return to Revision": {
    bg: "bg-[#ffebee]",
    text: "text-[#c62828]",
    label: "Return to Revision",
  },
  Retracted: {
    bg: "bg-[#1a1c1c]",
    text: "text-white",
    label: "Retracted",
  },
};

interface StatusBadgeProps {
  status: ManuscriptStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">{status}</span>;
  return (
    <span
      className={`px-3 py-1 ${config.bg} ${config.text} text-xs font-['Public_Sans',sans-serif] rounded-full`}
    >
      {config.label}
    </span>
  );
}
