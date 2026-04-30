import type { ManuscriptStatus } from "@/types";

const statusConfig: Partial<
  Record<ManuscriptStatus, { bg: string; text: string; label: string }>
> = {
  "In Submission Queue": {
    bg: "bg-[#e3f2fd]",
    text: "text-[#1565c0]",
    label: "In Submission Queue",
  },
  "Administrative Check": {
    bg: "bg-[#fff3e0]",
    text: "text-[#e65100]",
    label: "Administrative Check",
  },
  "Editor In Chief Screening": {
    bg: "bg-[#fce4ec]",
    text: "text-[#c2185b]",
    label: "EIC Screening",
  },
  "Peer Review": {
    bg: "bg-[#e8eaf6]",
    text: "text-[#3949ab]",
    label: "Peer Review",
  },
  "Returned to Author": {
    bg: "bg-[#fff8e1]",
    text: "text-[#f57f17]",
    label: "Returned to Author",
  },
  Rejected: {
    bg: "bg-[#ffebee]",
    text: "text-[#c62828]",
    label: "Rejected",
  },
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
  if (!config) {
    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">{status}</span>
    );
  }
  return (
    <span
      className={`px-3 py-1 ${config.bg} ${config.text} text-xs font-['Public_Sans',sans-serif] rounded-full`}
    >
      {config.label}
    </span>
  );
}
