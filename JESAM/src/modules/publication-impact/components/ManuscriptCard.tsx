import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RotateCcw,
  Archive,
  XCircle,
  Info,
  Upload,
  X,
  Download,
  Clock,
  AlertTriangle,
  Lock,
} from "lucide-react";
import type { Manuscript, ManuscriptStatus } from "../types";
import type { GalleyVersion } from "@/types";
import { PIPELINE_STAGES, STATUS_DEFINITIONS } from "../hooks/useManuscripts";
import StatusBadge from "@/components/common/StatusBadge";
import ClassificationBadge from "@/components/common/ClassificationBadge";

interface ManuscriptCardProps {
  manuscript: Manuscript;
  latestGalley?: GalleyVersion | null;
  galleyVersions?: GalleyVersion[];
  onTransition: (
    id: string,
    targetStatus: ManuscriptStatus,
    opts?: { isReturn?: boolean }
  ) => Promise<boolean>;
  onCompleteLayout: (id: string, file: File, note: string) => Promise<boolean>;
  onProofreadingDecision: (
    id: string,
    decision: "return" | "approve",
    remarks: string
  ) => Promise<boolean>;
  onLoadVersionHistory?: (id: string) => Promise<GalleyVersion[]>;
}

/* ── Stepper stage labels (abbreviated) ── */
const STAGE_LABELS: Record<string, string> = {
  "In Layout": "Layout",
  Proofreading: "Proofread",
  "Author Galley Review": "Author Review",
  "Scheduled for Publication": "Scheduled",
  "In Issue Management": "Issue Mgmt",
  Published: "Published",
};

/* ── Action definitions per status ── */
interface WorkflowAction {
  label: string;
  target: ManuscriptStatus;
  isReturn?: boolean;
  variant: "primary" | "secondary" | "danger";
  icon: typeof ArrowRight;
  /** If true, the button should be disabled */
  disabled?: boolean;
  disabledReason?: string;
}

function getWorkflowActions(
  status: ManuscriptStatus,
  authorApproved: boolean
): WorkflowAction[] {
  switch (status) {
    case "Author Galley Review":
      return [
        {
          label: authorApproved ? "Schedule for Publication" : "Awaiting Author Approval",
          target: "Scheduled for Publication",
          variant: "primary",
          icon: authorApproved ? ArrowRight : Lock,
          disabled: !authorApproved,
          disabledReason: "Author must approve the galley before scheduling",
        },
        {
          label: "Return to Proofreading",
          target: "Proofreading",
          isReturn: true,
          variant: "secondary",
          icon: RotateCcw,
        },
      ];
    case "Scheduled for Publication":
      return [
        {
          label: "Move to Issue Management",
          target: "In Issue Management",
          variant: "primary",
          icon: ArrowRight,
        },
      ];
    case "In Issue Management":
      return [
        {
          label: "Publish Online",
          target: "Published",
          variant: "primary",
          icon: ArrowRight,
        },
      ];
    default:
      // In Layout & Proofreading handled by dedicated forms
      return [];
  }
}

function isTerminal(status: ManuscriptStatus): boolean {
  return (
    status === "Published" ||
    status === "Archived" ||
    status === "Declined"
  );
}

export default function ManuscriptCard({
  manuscript,
  latestGalley,
  galleyVersions,
  onTransition,
  onCompleteLayout,
  onProofreadingDecision,
  onLoadVersionHistory,
}: ManuscriptCardProps) {
  const navigate = useNavigate();
  const [showTerminalMenu, setShowTerminalMenu] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Layout form state
  const [layoutFile, setLayoutFile] = useState<File | null>(null);
  const [layoutNote, setLayoutNote] = useState("");
  const [submittingLayout, setSubmittingLayout] = useState(false);
  const layoutFileRef = useRef<HTMLInputElement>(null);

  // Proofreading form state
  const [proofRemarks, setProofRemarks] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);

  // Version history
  const [showHistory, setShowHistory] = useState(false);
  const [historyVersions, setHistoryVersions] = useState<GalleyVersion[]>(
    galleyVersions ?? []
  );
  const [loadingHistory, setLoadingHistory] = useState(false);

  const currentStageIndex = PIPELINE_STAGES.indexOf(manuscript.status);
  const actions = getWorkflowActions(
    manuscript.status,
    manuscript.author_approved === true
  );
  const statusDef = STATUS_DEFINITIONS[manuscript.status];
  const terminal = isTerminal(manuscript.status);
  const noVersions = !latestGalley;

  const handleTransition = async (
    target: ManuscriptStatus,
    isReturn?: boolean
  ) => {
    setTransitioning(true);
    try {
      await onTransition(manuscript.id, target, { isReturn });
    } finally {
      setTransitioning(false);
      setShowTerminalMenu(false);
    }
  };

  const handleLayoutSubmit = async () => {
    if (!layoutFile) return;
    setSubmittingLayout(true);
    try {
      const success = await onCompleteLayout(
        manuscript.id,
        layoutFile,
        layoutNote.trim()
      );
      if (success) {
        setLayoutFile(null);
        setLayoutNote("");
      }
    } finally {
      setSubmittingLayout(false);
    }
  };

  const handleProofDecision = async (decision: "return" | "approve") => {
    if (!proofRemarks.trim() && decision === "return") {
      return; // Require remarks for returns
    }
    setSubmittingProof(true);
    try {
      const success = await onProofreadingDecision(
        manuscript.id,
        decision,
        proofRemarks.trim()
      );
      if (success) setProofRemarks("");
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleToggleHistory = async () => {
    if (!showHistory && historyVersions.length === 0 && onLoadVersionHistory) {
      setLoadingHistory(true);
      const versions = await onLoadVersionHistory(manuscript.id);
      setHistoryVersions(versions);
      setLoadingHistory(false);
    }
    setShowHistory(!showHistory);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] overflow-hidden hover:shadow-md transition-shadow">
      {/* ── Header ── */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-['Newsreader',serif] text-[18px] text-[#1a1c1c] mb-1 leading-snug">
              {manuscript.title}
            </h3>
            <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] mb-2 truncate">
              {manuscript.authors.join(", ")}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {manuscript.reference_code && (
                <span className="text-xs font-medium text-[#3f4b7e] font-['Public_Sans',sans-serif] bg-[#e8eaf6] px-2 py-0.5 rounded">
                  {manuscript.reference_code}
                </span>
              )}
              <span className="text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
                Submitted {new Date(manuscript.created_at).toLocaleDateString()}
              </span>
              {manuscript.author_approved && (
                <span className="text-xs font-medium text-[#2e7d32] bg-[#e8f5e9] px-2 py-0.5 rounded font-['Public_Sans',sans-serif] flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  Author Approved
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <ClassificationBadge classification={manuscript.classification} />
            <StatusBadge status={manuscript.status} />
          </div>
        </div>
      </div>

      {/* ── Pipeline Stepper ── */}
      <div className="px-6 py-4 bg-[#fafafa] border-t border-b border-[#e0e0e0]">
        <div className="flex items-center justify-between">
          {PIPELINE_STAGES.map((stage, index) => {
            const isCompleted = currentStageIndex > index;
            const isCurrent = currentStageIndex === index;
            const isTerminalCompleted = terminal && stage === "Published";

            return (
              <div key={stage} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center" title={STATUS_DEFINITIONS[stage]}>
                  <div
                    className={`
                      size-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                      ${
                        isCompleted || isTerminalCompleted
                          ? "bg-[#3f4b7e] text-white"
                          : isCurrent
                            ? "bg-[#3f4b7e] text-white ring-4 ring-[#3f4b7e]/20 animate-pulse"
                            : "bg-white border-2 border-[#d1d5db] text-[#9e9e9e]"
                      }
                    `}
                  >
                    {isCompleted || isTerminalCompleted ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-['Public_Sans',sans-serif] text-center leading-tight max-w-[72px] ${
                      isCurrent
                        ? "text-[#3f4b7e] font-semibold"
                        : isCompleted || isTerminalCompleted
                          ? "text-[#3f4b7e]"
                          : "text-[#9e9e9e]"
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </span>
                </div>

                {index < PIPELINE_STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mt-[-16px] ${
                      currentStageIndex > index
                        ? "bg-[#3f4b7e]"
                        : "bg-[#d1d5db]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Status Definition ── */}
      {statusDef && (
        <div className="px-6 py-2.5 bg-[#f0f4ff] flex items-center gap-2">
          <Info className="size-3.5 text-[#3f4b7e] shrink-0" />
          <span className="text-xs text-[#3f4b7e] font-['Public_Sans',sans-serif]">
            <span className="font-semibold">{manuscript.status}:</span>{" "}
            {statusDef}
          </span>
        </div>
      )}

      {/* ── Current Galley Bar ── */}
      {!terminal && (
        <div className="px-6 py-3 border-t border-[#e0e0e0] bg-[#fafafa]">
          {noVersions ? (
            <div className="flex items-center gap-2 p-3 bg-[#fff3e0] border border-[#ffb74d] rounded-lg">
              <AlertTriangle className="size-4 text-[#e65100] shrink-0" />
              <span className="text-xs text-[#e65100] font-['Public_Sans',sans-serif]">
                No file versions found. Layout required.
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="size-4 text-[#3f4b7e]" />
                <div>
                  <span className="text-xs font-semibold text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                    Current Galley — v{latestGalley.revision_number}
                  </span>
                  <span className="text-[10px] text-[#9e9e9e] font-['Public_Sans',sans-serif] ml-2">
                    {new Date(latestGalley.submitted_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={latestGalley.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-['Public_Sans',sans-serif] text-[#3f4b7e] bg-[#e8eaf6] rounded hover:bg-[#c5cae9] transition-colors"
                >
                  <Download className="size-3" />
                  Download
                </a>
                {/* Version history toggle */}
                <button
                  onClick={handleToggleHistory}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-['Public_Sans',sans-serif] text-[#6b7280] border border-[#e0e0e0] rounded hover:border-[#3f4b7e] hover:text-[#3f4b7e] transition-colors"
                >
                  <Clock className="size-3" />
                  History
                  {showHistory ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
              </div>
            </div>
          )}

          {/* ── Version History Dropdown ── */}
          {showHistory && (
            <div className="mt-3 border border-[#e0e0e0] rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-[#f0f4ff] text-xs font-semibold text-[#3f4b7e] font-['Public_Sans',sans-serif]">
                Version History
              </div>
              {loadingHistory ? (
                <div className="px-3 py-4 text-center text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
                  Loading versions…
                </div>
              ) : historyVersions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
                  No previous versions
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {historyVersions.map((v) => (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between px-3 py-2.5 border-t border-[#f0f0f0] hover:bg-[#fafafa] ${
                        v.id === latestGalley?.id ? "bg-[#e8eaf6]/50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                          v{v.revision_number}
                        </span>
                        <span className="text-[10px] text-[#9e9e9e] font-['Public_Sans',sans-serif]">
                          {new Date(v.submitted_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        {v.author_note && (
                          <span className="text-[10px] text-[#6b7280] font-['Public_Sans',sans-serif] truncate max-w-[200px]">
                            — {v.author_note}
                          </span>
                        )}
                        {v.id === latestGalley?.id && (
                          <span className="text-[10px] font-medium text-[#3f4b7e] bg-[#e8eaf6] px-1.5 py-0.5 rounded font-['Public_Sans',sans-serif]">
                            Latest
                          </span>
                        )}
                      </div>
                      <a
                        href={v.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#3f4b7e] underline font-['Public_Sans',sans-serif] hover:text-[#3f4b7e]/80 shrink-0"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── In Layout: Upload Galley Form ── */}
      {manuscript.status === "In Layout" && (
        <div className="px-6 py-4 border-t border-[#e0e0e0]">
          <div className="bg-[#f9fafb] rounded-lg border border-[#e0e0e0] p-5">
            <h4 className="text-sm font-semibold text-[#1a1c1c] font-['Public_Sans',sans-serif] mb-3 flex items-center gap-2">
              <Upload className="size-4 text-[#3f4b7e]" />
              Complete Layout — Upload Galley File
            </h4>

            {/* File upload */}
            <input
              ref={layoutFileRef}
              type="file"
              className="hidden"
              onChange={(e) => setLayoutFile(e.target.files?.[0] ?? null)}
            />
            {layoutFile ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#e8eaf6] rounded-lg mb-3">
                <FileText className="size-4 text-[#3f4b7e]" />
                <span className="text-xs text-[#3f4b7e] font-['Public_Sans',sans-serif] flex-1 truncate">
                  {layoutFile.name}
                </span>
                <button
                  onClick={() => setLayoutFile(null)}
                  className="p-0.5 hover:bg-[#3f4b7e]/10 rounded"
                >
                  <X className="size-3 text-[#3f4b7e]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => layoutFileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-3 text-xs font-['Public_Sans',sans-serif] text-[#6b7280] border-2 border-dashed border-[#d1d5db] rounded-lg hover:border-[#3f4b7e] hover:text-[#3f4b7e] transition-colors w-full justify-center mb-3"
              >
                <Upload className="size-4" />
                Click to upload galley file (PDF, HTML, etc.)
              </button>
            )}

            {/* Notes */}
            <textarea
              value={layoutNote}
              onChange={(e) => setLayoutNote(e.target.value)}
              placeholder="Layout notes (optional)..."
              rows={2}
              className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-lg text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#3f4b7e]/30 focus:border-[#3f4b7e] resize-none mb-3"
            />

            <button
              disabled={!layoutFile || submittingLayout}
              onClick={handleLayoutSubmit}
              className="w-full py-2.5 rounded-lg text-sm font-['Public_Sans',sans-serif] font-medium bg-[#3f4b7e] text-white hover:bg-[#3f4b7e]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingLayout ? "Uploading..." : "Upload & Move to Proofreading"}
            </button>
          </div>
        </div>
      )}

      {/* ── Proofreading: Decision Form ── */}
      {manuscript.status === "Proofreading" && (
        <div className="px-6 py-4 border-t border-[#e0e0e0]">
          <div className="bg-[#f9fafb] rounded-lg border border-[#e0e0e0] p-5">
            <h4 className="text-sm font-semibold text-[#1a1c1c] font-['Public_Sans',sans-serif] mb-3">
              Proofreading Decision
            </h4>

            {/* Previous editor remarks */}
            {manuscript.editor_remarks && (
              <div className="mb-3 p-3 bg-[#fff3e0] border border-[#ffb74d] rounded-lg">
                <span className="text-[10px] uppercase tracking-wider text-[#e65100] font-semibold font-['Public_Sans',sans-serif]">
                  Previous Remarks
                </span>
                <p className="text-xs text-[#1a1c1c] font-['Public_Sans',sans-serif] mt-1 whitespace-pre-wrap">
                  {manuscript.editor_remarks}
                </p>
              </div>
            )}

            <textarea
              value={proofRemarks}
              onChange={(e) => setProofRemarks(e.target.value)}
              placeholder="Enter proofreading remarks..."
              rows={3}
              className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-lg text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#3f4b7e]/30 focus:border-[#3f4b7e] resize-none mb-3"
            />

            <div className="flex gap-3">
              <button
                disabled={!proofRemarks.trim() || submittingProof}
                onClick={() => handleProofDecision("return")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-['Public_Sans',sans-serif] font-medium bg-white border border-[#e0e0e0] text-[#6b7280] hover:border-[#e65100] hover:text-[#e65100] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="size-3.5" />
                Return to Layout
              </button>
              <button
                disabled={submittingProof}
                onClick={() => handleProofDecision("approve")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-['Public_Sans',sans-serif] font-medium bg-[#3f4b7e] text-white hover:bg-[#3f4b7e]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="size-3.5" />
                Send to Author Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Workflow Actions (for statuses beyond Proofreading) ── */}
      <div className="px-6 py-4 flex items-center justify-between gap-3 border-t border-[#e0e0e0]">
        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((action) => (
            <button
              key={action.target}
              disabled={transitioning || action.disabled}
              onClick={() =>
                handleTransition(action.target, action.isReturn)
              }
              title={action.disabled ? action.disabledReason : undefined}
              className={`
                flex items-center gap-1.5 px-4 py-2 text-sm font-['Public_Sans',sans-serif] rounded transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  action.variant === "primary" && !action.disabled
                    ? "bg-[#3f4b7e] text-white hover:bg-[#3f4b7e]/90"
                    : action.variant === "danger"
                      ? "bg-[#c62828] text-white hover:bg-[#c62828]/90"
                      : "bg-white border border-[#e0e0e0] text-[#6b7280] hover:border-[#3f4b7e] hover:text-[#3f4b7e]"
                }
              `}
            >
              <action.icon className="size-3.5" />
              {action.label}
            </button>
          ))}

          {/* Terminal-state controls (Archive / Decline) */}
          {!terminal && (
            <div className="relative">
              <button
                onClick={() => setShowTerminalMenu(!showTerminalMenu)}
                className="flex items-center gap-1 px-3 py-2 text-xs font-['Public_Sans',sans-serif] text-[#9e9e9e] hover:text-[#6b7280] transition-colors"
              >
                More
                <ChevronDown className="size-3" />
              </button>
              {showTerminalMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#e0e0e0] rounded-lg shadow-lg z-10 min-w-[160px]">
                  <button
                    disabled={transitioning}
                    onClick={() => handleTransition("Archived")}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-['Public_Sans',sans-serif] text-[#4e342e] hover:bg-[#efebe9] transition-colors rounded-t-lg"
                  >
                    <Archive className="size-3.5" />
                    Archive
                  </button>
                  <button
                    disabled={transitioning}
                    onClick={() => handleTransition("Declined")}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-['Public_Sans',sans-serif] text-[#b71c1c] hover:bg-[#ffebee] transition-colors rounded-b-lg"
                  >
                    <XCircle className="size-3.5" />
                    Decline
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* View Details */}
        <button
          onClick={() => navigate(`/article/${manuscript.id}`)}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#e0e0e0] text-[#1a1c1c] text-sm font-['Public_Sans',sans-serif] rounded hover:bg-[#f5f5f5] transition-colors shrink-0"
        >
          <FileText className="size-3.5" />
          View Details
        </button>
      </div>
    </div>
  );
}
