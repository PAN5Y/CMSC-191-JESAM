import { useState } from "react";
import Modal from "@/components/common/Modal";

interface CorrectionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (correctionText: string) => void;
}

export default function CorrectionModal({
  open,
  onClose,
  onSubmit,
}: CorrectionModalProps) {
  const [correctionText, setCorrectionText] = useState("");

  const handleSubmit = () => {
    onSubmit(correctionText);
    setCorrectionText("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Correction"
      maxWidth="max-w-lg"
    >
      <div>
        <label className="text-xs uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif] block mb-2">
          Describe the correction needed
        </label>
        <textarea
          value={correctionText}
          onChange={(e) => setCorrectionText(e.target.value)}
          rows={5}
          placeholder="Provide details about the error or amendment required..."
          className="w-full px-4 py-2 border border-[#e0e0e0] rounded font-['Public_Sans',sans-serif] text-sm resize-none focus:border-[#3f4b7e] focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => {
            setCorrectionText("");
            onClose();
          }}
          className="px-4 py-2 border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#f5f5f5] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!correctionText}
          className="px-4 py-2 bg-[#f57c00] text-white rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#f57c00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Request
        </button>
      </div>
    </Modal>
  );
}
