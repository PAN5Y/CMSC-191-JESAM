import { useState } from "react";
import { FileWarning, AlertTriangle, RotateCcw } from "lucide-react";
import type { Manuscript } from "../types";

interface PostPublicationMgmtProps {
  manuscript: Manuscript;
  onRetractManuscript: () => Promise<boolean>;
  onReturnToRevision: () => Promise<boolean>;
}

export default function PostPublicationMgmt({
  manuscript,
  onRetractManuscript,
  onReturnToRevision,
}: PostPublicationMgmtProps) {
  const [showRetractConfirm, setShowRetractConfirm] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const [isProcessingErrata, setIsProcessingErrata] = useState(false);

  const handleRetract = async () => {
    setIsRetracting(true);
    await onRetractManuscript();
    setIsRetracting(false);
    setShowRetractConfirm(false);
  };

  const handleErrata = async () => {
    setIsProcessingErrata(true);
    await onReturnToRevision();
    setIsProcessingErrata(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-8">
      <div className="mb-6">
        <h3 className="font-['Newsreader',serif] text-[24px] text-[#1a1c1c] leading-[32px] mb-2">
          Post-Publication Management
        </h3>
        <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
          Process corrections or retract this article
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Errata / Correction */}
        <div className="p-5 bg-[#fff8e1] border border-[#F5C344] rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FileWarning className="size-5 text-[#f57c00]" />
            <h4 className="font-['Newsreader',serif] text-[16px] text-[#1a1c1c]">
              Process Errata
            </h4>
          </div>
          <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif] mb-4">
            Return to revision for corrections. Status will change to "Return to
            Revision" and the manuscript can be re-published after fixes.
          </p>
          <button
            onClick={handleErrata}
            disabled={isProcessingErrata || manuscript.status === "Retracted"}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#F5C344] text-[#f57c00] rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#fff8e1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingErrata ? (
              <>
                <div className="size-4 border-2 border-[#f57c00]/30 border-t-[#f57c00] rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RotateCcw className="size-4" />
                Return to Revision
              </>
            )}
          </button>
        </div>

        {/* Retraction */}
        <div className="p-5 bg-[#ffebee] border border-[#c62828] rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-5 text-[#c62828]" />
            <h4 className="font-['Newsreader',serif] text-[16px] text-[#1a1c1c]">
              Retract Article
            </h4>
          </div>
          <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif] mb-4">
            Permanently retract this article. This action is serious and should
            only be used for research misconduct or critical errors.
          </p>

          {showRetractConfirm ? (
            <div className="space-y-2">
              <p className="text-xs text-[#c62828] font-['Public_Sans',sans-serif] font-medium">
                ⚠️ Are you sure? This cannot be easily undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRetract}
                  disabled={isRetracting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#c62828] text-white rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#c62828]/90 transition-colors disabled:opacity-50"
                >
                  {isRetracting ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Retracting...
                    </>
                  ) : (
                    "Confirm Retraction"
                  )}
                </button>
                <button
                  onClick={() => setShowRetractConfirm(false)}
                  className="px-4 py-2 bg-white border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#f5f5f5] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRetractConfirm(true)}
              disabled={manuscript.status === "Retracted"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#c62828] text-[#c62828] rounded text-sm font-['Public_Sans',sans-serif] hover:bg-[#ffebee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle className="size-4" />
              {manuscript.status === "Retracted"
                ? "Already Retracted"
                : "Retract Article"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
