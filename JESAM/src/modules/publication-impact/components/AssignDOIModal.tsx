import { useState } from "react";
import { Database, Edit, RefreshCw, ExternalLink } from "lucide-react";
import Modal from "@/components/common/Modal";

interface AssignDOIModalProps {
  open: boolean;
  onClose: () => void;
  currentDOI?: string;
  onAutoGenerate: () => Promise<{ success: boolean; doi: string; error?: string }>;
  onManualAssign: (doi: string) => void;
}

export default function AssignDOIModal({
  open,
  onClose,
  currentDOI,
  onAutoGenerate,
  onManualAssign,
}: AssignDOIModalProps) {
  const [method, setMethod] = useState<"auto" | "manual">("auto");
  const [manualDOI, setManualDOI] = useState(currentDOI || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [crossrefError, setCrossrefError] = useState<string | null>(null);

  const handleAssign = async () => {
    if (method === "auto") {
      setIsGenerating(true);
      setCrossrefError(null);
      const result = await onAutoGenerate();
      setIsGenerating(false);

      if (result.success) {
        onClose();
      } else {
        // Crossref failed — show error and switch to manual with pre-filled DOI
        setCrossrefError(result.error || "Crossref registration failed");
        setManualDOI(result.doi);
        setMethod("manual");
      }
    } else {
      if (!manualDOI) return;
      onManualAssign(manualDOI);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign DOI" maxWidth="max-w-lg">
      {/* Crossref Error Banner */}
      {crossrefError && (
        <div className="mb-4 p-3 bg-[#fff8e1] border border-[#F5C344] rounded-lg">
          <p className="text-sm text-[#f57c00] font-['Public_Sans',sans-serif] mb-2">
            ⚠️ {crossrefError}
          </p>
          <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif]">
            Please register the DOI manually below, or use the{" "}
            <a
              href="https://apps.crossref.org/webDeposit/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3f4b7e] underline inline-flex items-center gap-1"
            >
              Crossref Web Deposit Form <ExternalLink className="size-3" />
            </a>
          </p>
        </div>
      )}

      {/* Method Selection */}
      <div className="mb-6">
        <label className="text-xs uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif] block mb-3">
          Assignment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setMethod("auto"); setCrossrefError(null); }}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              method === "auto"
                ? "border-[#3f4b7e] bg-[#e8eaf6]"
                : "border-[#e0e0e0] hover:border-[#3f4b7e]/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Database className="size-5 text-[#3f4b7e]" />
              <span className="text-sm font-['Public_Sans',sans-serif] font-medium text-[#1a1c1c]">
                Automatic
              </span>
            </div>
            <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif]">
              Register via Crossref API
            </p>
          </button>

          <button
            onClick={() => setMethod("manual")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              method === "manual"
                ? "border-[#3f4b7e] bg-[#e8eaf6]"
                : "border-[#e0e0e0] hover:border-[#3f4b7e]/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Edit className="size-5 text-[#3f4b7e]" />
              <span className="text-sm font-['Public_Sans',sans-serif] font-medium text-[#1a1c1c]">
                Manual
              </span>
            </div>
            <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif]">
              Enter DOI manually
            </p>
          </button>
        </div>
      </div>

      {/* Manual DOI Input */}
      {method === "manual" && (
        <div className="mb-6">
          <label className="text-xs uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif] block mb-2">
            DOI
          </label>
          <input
            type="text"
            value={manualDOI}
            onChange={(e) => setManualDOI(e.target.value)}
            placeholder="10.47125/jesam.2026.27.1.XX"
            className="w-full px-4 py-2 border border-[#e0e0e0] rounded font-['Public_Sans',sans-serif] text-sm focus:border-[#3f4b7e] focus:outline-none"
          />
          <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif] mt-2">
            Format: 10.47125/jesam.YYYY.VV.N.XX
          </p>
          <a
            href="https://apps.crossref.org/webDeposit/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs text-[#3f4b7e] font-['Public_Sans',sans-serif] flex items-center gap-1 hover:underline"
          >
            <ExternalLink className="size-3" />
            Register DOI externally via Crossref Web Deposit
          </a>
        </div>
      )}

      {/* Auto DOI Preview */}
      {method === "auto" && !crossrefError && (
        <div className="mb-6 p-4 bg-[#e8eaf6] rounded-lg border border-[#3f4b7e]/20">
          <div className="flex items-start gap-3">
            <Database className="size-5 text-[#3f4b7e] mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c] mb-1">
                Crossref Integration
              </div>
              <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif] mb-2">
                DOI will be automatically generated and registered with Crossref
                based on manuscript metadata.
              </p>
              {currentDOI && (
                <div className="text-xs font-['Public_Sans',sans-serif] text-[#3f4b7e] mt-2">
                  Current DOI: {currentDOI}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#f5f5f5] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAssign}
          disabled={isGenerating || (method === "manual" && !manualDOI)}
          className="px-4 py-2 bg-[#3f4b7e] text-white rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#3f4b7e]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              Registering with Crossref...
            </>
          ) : method === "auto" ? (
            "Generate & Register DOI"
          ) : (
            "Assign DOI"
          )}
        </button>
      </div>
    </Modal>
  );
}
