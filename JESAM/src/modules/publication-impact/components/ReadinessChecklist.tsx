import { CheckCircle2, AlertCircle, Edit, Upload, Database, RotateCcw } from "lucide-react";
import type { Manuscript, ReadinessStatus } from "../types";

interface ReadinessChecklistProps {
  manuscript: Manuscript;
  readiness: ReadinessStatus;
  isAuthor?: boolean;
  onEditMetadata: () => void;
  onUploadFile: () => void;
  onAssignDOI: () => void;
  onReturnToRevision: () => void;
}

export default function ReadinessChecklist({
  manuscript,
  readiness,
  isAuthor = false,
  onEditMetadata,
  onUploadFile,
  onAssignDOI,
  onReturnToRevision,
}: ReadinessChecklistProps) {
  const checklistItems = [
    {
      label: "Metadata Complete",
      done: readiness.metadataComplete,
      action: { label: "Edit Metadata", icon: Edit, onClick: onEditMetadata },
    },
    {
      label: "Files Ready (PDF)",
      done: readiness.filesReady,
      subtitle: readiness.filesReady ? manuscript.file_url?.split("/").pop() : undefined,
      action: {
        label: readiness.filesReady ? "Replace File" : "Upload File",
        icon: Upload,
        onClick: onUploadFile,
      },
    },
    {
      label: "DOI Assigned",
      done: readiness.doiAssigned,
      subtitle: readiness.doiAssigned ? manuscript.doi : undefined,
      action: {
        label: readiness.doiAssigned ? "Edit DOI" : "Assign DOI",
        icon: Database,
        onClick: onAssignDOI,
      },
    },
  ];

  return (
    <div className="mb-6">
      {/* Readiness Toggle */}
      {!isAuthor && (
        <div className="p-5 bg-[#fff8e1] border border-[#F5C344] rounded-lg mb-4">
          <h4 className="font-['Newsreader',serif] text-[16px] text-[#1a1c1c] mb-2">
            Is this manuscript ready for production?
          </h4>
          <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif] mb-3">
            If the manuscript is not ready, return it to the revision stage.
          </p>
          <button
            onClick={onReturnToRevision}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] text-[#c62828] hover:bg-[#ffebee] transition-colors"
          >
            <RotateCcw className="size-4" />
            No — Return to Revision
          </button>
        </div>
      )}

      {/* Pre-Publication Checklist */}
      <div className="p-6 bg-[#f5f5f5] rounded-lg">
        <h4 className="font-['Newsreader',serif] text-[18px] text-[#1a1c1c] mb-4">
          Pre-Publication Checklist
        </h4>
        <div className="space-y-3">
          {checklistItems.map((item) => {
            const ActionIcon = item.action.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-between p-4 bg-white border border-[#e0e0e0] rounded"
              >
                <div className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 className="size-5 text-[#2e7d32]" />
                  ) : (
                    <AlertCircle className="size-5 text-[#f57c00]" />
                  )}
                  <div>
                    <span className="text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c] block">
                      {item.label}
                    </span>
                    {item.subtitle && (
                      <span className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif] break-all">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </div>
                {!isAuthor && (
                  <button
                    onClick={item.action.onClick}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#3f4b7e] hover:bg-[#e8eaf6] rounded transition-colors font-['Public_Sans',sans-serif]"
                  >
                    <ActionIcon className="size-3" />
                    {item.action.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
