import { toast } from "sonner";
import { Download, Copy } from "lucide-react";
import Modal from "@/components/common/Modal";
import type { Manuscript } from "../types";
import { generateMetadataXML, downloadMetadataXML } from "@/lib/xml-export";

interface MetadataExportModalProps {
  open: boolean;
  onClose: () => void;
  manuscript: Manuscript;
}

export default function MetadataExportModal({
  open,
  onClose,
  manuscript,
}: MetadataExportModalProps) {
  const xmlContent = generateMetadataXML(manuscript);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Metadata Export (XML)"
      maxWidth="max-w-3xl"
    >
      <div className="bg-[#1a1c1c] text-[#4ade80] p-4 rounded font-mono text-xs overflow-auto max-h-96">
        <pre>{xmlContent}</pre>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#f5f5f5] transition-colors"
        >
          Close
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(xmlContent);
            toast.success("XML copied to clipboard");
          }}
          className="flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#f5f5f5] transition-colors"
        >
          <Copy className="size-4" />
          Copy
        </button>
        <button
          onClick={() => downloadMetadataXML(manuscript)}
          className="flex items-center gap-2 px-4 py-2 bg-[#3f4b7e] text-white rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#3f4b7e]/90 transition-colors"
        >
          <Download className="size-4" />
          Download XML
        </button>
      </div>
    </Modal>
  );
}
