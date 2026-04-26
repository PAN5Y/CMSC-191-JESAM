import { useState, useEffect } from "react";
import { BookOpen, Check } from "lucide-react";

interface IssueAssignmentProps {
  currentAssignment?: string;
  onAssign: (assignment: string) => Promise<boolean>;
}

const issueOptions = [
  "Online-First (Advance Publication)",
  "Volume 27, Issue 1 (2026)",
  "Volume 27, Issue 2 (2026)",
  "Volume 28, Issue 1 (2027)",
];

export default function IssueAssignment({
  currentAssignment,
  onAssign,
}: IssueAssignmentProps) {
  const [selected, setSelected] = useState(currentAssignment || "");
  const [customValue, setCustomValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(!!currentAssignment);

  useEffect(() => {
    if (currentAssignment) {
      setSelected(currentAssignment);
      setSaved(true);
    }
  }, [currentAssignment]);

  const handleSave = async () => {
    const value = selected === "custom" ? customValue : selected;
    if (!value) return;
    setIsSaving(true);
    const success = await onAssign(value);
    setIsSaving(false);
    if (success) setSaved(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-6 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="size-5 text-[#3f4b7e]" />
        <h4 className="font-['Newsreader',serif] text-[18px] text-[#1a1c1c]">
          Issue Assignment
        </h4>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-[#2e7d32] bg-[#e8f5e9] px-2 py-1 rounded font-['Public_Sans',sans-serif]">
            <Check className="size-3" /> Saved
          </span>
        )}
      </div>
      <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mb-4">
        Select where this article will be published.
      </p>

      <div className="space-y-2 mb-4">
        {issueOptions.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
              selected === option
                ? "border-[#3f4b7e] bg-[#e8eaf6]"
                : "border-[#e0e0e0] hover:border-[#3f4b7e]/50"
            }`}
          >
            <input
              type="radio"
              name="issue"
              value={option}
              checked={selected === option}
              onChange={(e) => { setSelected(e.target.value); setSaved(false); }}
              className="accent-[#3f4b7e]"
            />
            <span className="text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c]">
              {option}
            </span>
          </label>
        ))}
        <label
          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
            selected === "custom"
              ? "border-[#3f4b7e] bg-[#e8eaf6]"
              : "border-[#e0e0e0] hover:border-[#3f4b7e]/50"
          }`}
        >
          <input
            type="radio"
            name="issue"
            value="custom"
            checked={selected === "custom"}
            onChange={() => { setSelected("custom"); setSaved(false); }}
            className="accent-[#3f4b7e]"
          />
          <span className="text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c]">
            Other:
          </span>
          {selected === "custom" && (
            <input
              type="text"
              value={customValue}
              onChange={(e) => { setCustomValue(e.target.value); setSaved(false); }}
              placeholder="e.g. Volume 28, Issue 2 (2027)"
              className="flex-1 px-3 py-1 border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] focus:border-[#3f4b7e] focus:outline-none"
            />
          )}
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={!selected || (selected === "custom" && !customValue) || isSaving}
        className="px-4 py-2 bg-[#3f4b7e] text-white rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#3f4b7e]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isSaving ? (
          <>
            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          "Save Assignment"
        )}
      </button>
    </div>
  );
}
