import type { Manuscript } from "@/types";

type StageState = "completed" | "current" | "upcoming" | "rejected";

interface Stage {
  key: string;
  label: string;
  state: StageState;
}

const STAGE_KEYS = [
  { key: "submit",    label: "Submit" },
  { key: "peer",      label: "Peer Review" },
  { key: "decision",  label: "Decision" },
  { key: "editorial", label: "Editorial Review" },
  { key: "revision",  label: "Revision" },
  { key: "checking",  label: "Checking" },
  { key: "published", label: "Published" },
] as const;

/** Index of the Decision stage — rejected manuscripts show the rejected state here. */
const DECISION_IDX = 2;

function currentStageIndex(manuscript: Manuscript): number {
  const hasRevisionUploads =
    (manuscript.submission_metadata?.revision_cycle?.rounds?.length ?? 0) > 0;

  switch (manuscript.status) {
    case "Pending Format Verification":
    case "Editor In Chief Screening":
      return 0; // Submit
    case "Peer Review":
      // After revision upload the manuscript is back for checking
      return hasRevisionUploads ? 5 : 1;
    case "Editorial Review":
      return 3; // Decision is already completed (approved)
    case "Revision Requested":
    case "Returned to Author":
    case "Return to Revision":
      return 4; // Revision
    case "Accepted":
    case "In Production":
      return 5; // Checking (completed)
    case "Published":
      return 6; // Published
    case "Rejected":
      return -1; // Special: Decision shows as rejected
    default:
      return 0;
  }
}

function buildStages(manuscript: Manuscript): Stage[] {
  const idx = currentStageIndex(manuscript);
  const isRejected = manuscript.status === "Rejected";

  return STAGE_KEYS.map((s, i) => {
    let state: StageState;
    if (isRejected && i === DECISION_IDX) {
      state = "rejected";
    } else if (isRejected && i < DECISION_IDX) {
      state = "completed";
    } else if (i < idx) {
      state = "completed";
    } else if (i === idx) {
      state = "current";
    } else {
      state = "upcoming";
    }
    return { ...s, state };
  });
}

function currentStageLabel(manuscript: Manuscript): string {
  const hasRevisionUploads =
    (manuscript.submission_metadata?.revision_cycle?.rounds?.length ?? 0) > 0;

  switch (manuscript.status) {
    case "Pending Format Verification":
      return "Format Verification";
    case "Editor In Chief Screening":
      return "EIC Screening";
    case "Peer Review":
      return hasRevisionUploads ? "Checking" : "Peer Review";
    case "Editorial Review":
      return "Editorial Review";
    case "Revision Requested":
    case "Returned to Author":
    case "Return to Revision":
      return "Revision";
    case "Accepted":
      return "Accepted";
    case "In Production":
      return "In Production";
    case "Published":
      return "Published";
    case "Rejected":
      return "Rejected";
    default:
      return manuscript.status;
  }
}

function latestAuditEntry(manuscript: Manuscript): { note: string; date: string } | null {
  const logs = manuscript.submission_metadata?.audit_logs ?? [];
  if (logs.length === 0) return null;
  const latest = logs[logs.length - 1];
  return { note: latest.note ?? latest.action, date: latest.createdAt };
}

function nodeClass(state: StageState): string {
  switch (state) {
    case "completed":
      return "bg-green-100 border-2 border-green-500";
    case "current":
      return "bg-white border-2 border-purple-500 ring-2 ring-purple-200";
    case "rejected":
      return "bg-red-500 border-2 border-red-600";
    default:
      return "bg-gray-100 border-2 border-gray-300";
  }
}

function labelClass(state: StageState): string {
  switch (state) {
    case "completed":
      return "text-green-700";
    case "current":
      return "text-purple-700 font-semibold";
    case "rejected":
      return "text-red-700";
    default:
      return "text-gray-400";
  }
}

interface ManuscriptTrackerProps {
  manuscript: Manuscript;
}

export function ManuscriptTracker({ manuscript }: ManuscriptTrackerProps) {
  const stages = buildStages(manuscript);
  const stageLabel = currentStageLabel(manuscript);
  const audit = latestAuditEntry(manuscript);
  const isRejected = manuscript.status === "Rejected";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 text-sm mb-0.5">Revision tracker</h3>
      <p className="text-xs text-gray-500 mb-4">Track every revision stage the paper has gone through</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Pipeline */}
        <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-lg px-5 py-4">
          {/* Circles + connectors row — labels are absolutely positioned under each circle */}
          <div className="flex items-center pb-8">
            {stages.map((stage, i) => (
              <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                {/* Circle with label anchored below it */}
                <div className="relative shrink-0">
                  <div className={`w-9 h-9 rounded-full ${nodeClass(stage.state)}`} />
                  <span
                    className={`absolute top-10 left-1/2 -translate-x-1/2 w-16 text-[10px] leading-tight text-center ${labelClass(stage.state)}`}
                  >
                    {stage.label}
                  </span>
                </div>
                {/* Connector to next stage */}
                {i < stages.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      stage.state === "completed" ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {[
              { cls: "bg-green-100 border border-green-500", label: "Completed" },
              { cls: "bg-white border-2 border-purple-500", label: "Current Stage" },
              { cls: "bg-gray-100 border border-gray-300", label: "Upcoming" },
              { cls: "bg-red-500", label: "Rejected" },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cls}`} />
                <span className="text-[10px] text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:w-48 shrink-0 flex flex-col gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Current stage</p>
            <span
              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                isRejected ? "bg-red-100 text-red-800" : "bg-purple-100 text-purple-800"
              }`}
            >
              {stageLabel}
            </span>
          </div>

          {audit ? (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-gray-400">
                {new Date(audit.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <div className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                <p className="text-xs text-gray-700 leading-snug">{audit.note}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No activity recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
