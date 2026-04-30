import type { JournalClassification } from "@/types";

const classStyles: Record<JournalClassification, string> = {
  Land: "bg-[#8d6e63] text-white",
  Air: "bg-[#64b5f6] text-white",
  Water: "bg-[#4fc3f7] text-white",
  People: "bg-[#ba68c8] text-white",
};

interface ClassificationBadgeProps {
  classification: JournalClassification | null;
}

export default function ClassificationBadge({ classification }: ClassificationBadgeProps) {
  if (!classification) {
    return (
      <span className="px-3 py-1 text-xs font-['Public_Sans',sans-serif] rounded-full bg-gray-200 text-gray-600">
        Unclassified
      </span>
    );
  }
  return (
    <span
      className={`px-3 py-1 text-xs font-['Public_Sans',sans-serif] rounded-full ${classStyles[classification]}`}
    >
      {classification}
    </span>
  );
}
