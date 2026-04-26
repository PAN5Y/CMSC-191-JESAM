import { Download } from "lucide-react";
import { useNavigate } from "react-router";
import Modal from "@/components/common/Modal";
import type { Manuscript } from "../types";

interface ArticlePreviewModalProps {
  open: boolean;
  onClose: () => void;
  manuscript: Manuscript;
}

export default function ArticlePreviewModal({
  open,
  onClose,
  manuscript,
}: ArticlePreviewModalProps) {
  const navigate = useNavigate();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Public Article Page Preview"
      maxWidth="max-w-4xl"
    >
      <div className="border-t border-[#e0e0e0] pt-6">
        <h1 className="font-['Newsreader',serif] text-[36px] text-[#1a1c1c] leading-tight mb-4">
          {manuscript.title}
        </h1>

        <div className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mb-6">
          {manuscript.authors.join(", ")}
        </div>

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#e0e0e0]">
          <div className="text-sm font-['Public_Sans',sans-serif]">
            <span className="text-[#6b7280]">DOI:</span>{" "}
            <span className="text-[#3f4b7e]">{manuscript.doi || "Pending"}</span>
          </div>
          <div className="h-4 w-px bg-[#e0e0e0]" />
          <div className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
            Published:{" "}
            {manuscript.published_at
              ? new Date(manuscript.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Pending"}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-['Newsreader',serif] text-[20px] text-[#1a1c1c] mb-3">
            Abstract
          </h4>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] leading-relaxed">
            {manuscript.abstract}
          </p>
        </div>

        <div className="mb-6">
          <h4 className="font-['Newsreader',serif] text-[20px] text-[#1a1c1c] mb-3">
            Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {manuscript.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[#e8eaf6] text-xs text-[#3f4b7e] font-['Public_Sans',sans-serif] rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {manuscript.file_url && (
            <a
              href={manuscript.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-[#3f4b7e] text-white rounded font-['Public_Sans',sans-serif] hover:bg-[#3f4b7e]/90 transition-colors"
            >
              <Download className="size-5" />
              Download PDF
            </a>
          )}
          <button
            onClick={() => {
              onClose();
              navigate(`/article/public/${manuscript.id}`);
            }}
            className="px-6 py-3 border border-[#e0e0e0] text-[#1a1c1c] rounded font-['Public_Sans',sans-serif] hover:bg-[#f5f5f5] transition-colors"
          >
            Open Public Page →
          </button>
        </div>
      </div>
    </Modal>
  );
}
