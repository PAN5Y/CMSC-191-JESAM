import type { ManuscriptStatus } from "@/types";

const statusConfig: Partial<
  Record<ManuscriptStatus, { bg: string; text: string; label: string }>
> = {
  "Initial Screening": {
    bg: "bg-[#fce4ec]",
    text: "text-[#c2185b]",
    label: "Initial Screening",
  },
  "Pending Format Verification": {
    bg: "bg-[#e3f2fd]",
    text: "text-[#1565c0]",
    label: "Format verification",
  },
  "Editor In Chief Screening": {
    bg: "bg-[#fce4ec]",
    text: "text-[#c2185b]",
    label: "EIC Screening",
  },
  "Production Checks": {
    bg: "bg-[#e0f2fe]",
    text: "text-[#075985]",
    label: "Production Checks",
  },
  "For Format Revision": {
    bg: "bg-[#fff8e1]",
    text: "text-[#f57f17]",
    label: "For Format Revision",
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
  "Revision Requested": {
    bg: "bg-[#fff8e1]",
    text: "text-[#ef6c00]",
    label: "Revision Requested",
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
  "In Layout": {
    bg: "bg-[#ede7f6]",
    text: "text-[#5e35b1]",
    label: "In Layout",
  },
  Proofreading: {
    bg: "bg-[#e0f2f1]",
    text: "text-[#00695c]",
    label: "Proofreading",
  },
  "Author Galley Review": {
    bg: "bg-[#fff3e0]",
    text: "text-[#e65100]",
    label: "Author Galley Review",
  },
  "Scheduled for Publication": {
    bg: "bg-[#e8eaf6]",
    text: "text-[#283593]",
    label: "Scheduled",
  },
  "In Issue Management": {
    bg: "bg-[#e1f5fe]",
    text: "text-[#01579b]",
    label: "Issue Management",
  },
  Archived: {
    bg: "bg-[#efebe9]",
    text: "text-[#4e342e]",
    label: "Archived",
  },
  Declined: {
    bg: "bg-[#ffebee]",
    text: "text-[#b71c1c]",
    label: "Declined",
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
