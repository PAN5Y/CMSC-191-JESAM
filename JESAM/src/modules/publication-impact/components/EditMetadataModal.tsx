import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";

interface EditMetadataModalProps {
  open: boolean;
  onClose: () => void;
  initialTitle: string;
  initialAuthors: string[];
  initialAbstract: string;
  initialKeywords: string[];
  onSave: (data: { title: string; authors: string[]; abstract: string; keywords: string[] }) => void;
}

export default function EditMetadataModal({
  open,
  onClose,
  initialTitle,
  initialAuthors,
  initialAbstract,
  initialKeywords,
  onSave,
}: EditMetadataModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [authors, setAuthors] = useState(initialAuthors.join(", "));
  const [abstract, setAbstract] = useState(initialAbstract);
  const [keywords, setKeywords] = useState(initialKeywords.join(", "));

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setAuthors(initialAuthors.join(", "));
      setAbstract(initialAbstract);
      setKeywords(initialKeywords.join(", "));
    }
  }, [open, initialTitle, initialAuthors, initialAbstract, initialKeywords]);

  const handleSave = () => {
    onSave({
      title,
      authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
      abstract,
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Metadata">
      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif] block mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-[#e0e0e0] rounded font-['Public_Sans',sans-serif] text-sm focus:border-[#3f4b7e] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif] block mb-2">
            Authors (comma-separated)
          </label>
          <input
            type="text"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            className="w-full px-4 py-2 border border-[#e0e0e0] rounded font-['Public_Sans',sans-serif] text-sm focus:border-[#3f4b7e] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif] block mb-2">
            Abstract
          </label>
          <textarea
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            rows={5}
            className="w-full px-4 py-2 border border-[#e0e0e0] rounded font-['Public_Sans',sans-serif] text-sm resize-none focus:border-[#3f4b7e] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif] block mb-2">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full px-4 py-2 border border-[#e0e0e0] rounded font-['Public_Sans',sans-serif] text-sm focus:border-[#3f4b7e] focus:outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#f5f5f5] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#3f4b7e] text-white rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#3f4b7e]/90 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
}
