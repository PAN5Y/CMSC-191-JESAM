import { useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import Modal from "@/components/common/Modal";

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<boolean>;
}

export default function FileUploadModal({
  open,
  onClose,
  onUpload,
}: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const success = await onUpload(selectedFile);
    setIsUploading(false);
    if (success) {
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload Manuscript File"
      maxWidth="max-w-lg"
    >
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[#e0e0e0] rounded-lg p-8 text-center cursor-pointer hover:border-[#3f4b7e] transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="size-8 text-[#3f4b7e]" />
            <div className="text-left">
              <p className="text-sm text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="size-12 text-[#9e9e9e] mx-auto mb-4" />
            <p className="text-sm text-[#1a1c1c] font-['Public_Sans',sans-serif] mb-2">
              Click to browse or drag and drop
            </p>
            <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif]">
              PDF files only • Maximum 50 MB
            </p>
          </>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => { setSelectedFile(null); onClose(); }}
          className="px-4 py-2 border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#f5f5f5] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="px-4 py-2 bg-[#3f4b7e] text-white rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#3f4b7e]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload File"
          )}
        </button>
      </div>
    </Modal>
  );
}
