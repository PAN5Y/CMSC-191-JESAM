import type { Manuscript } from "@/types";

type StageState = "completed" | "current" | "upcoming" | "rejected" | "skipped";

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
  { key: "published", label: "For Layout and Proofreading" },
] as const;

const DECISION_IDX  = 2;
const EDITORIAL_IDX = 3;

/** Last completed editor decision across all peer-review rounds (most recent round first). */
function lastPeerReviewDecision(manuscript: Manuscript): string | undefined {
  const rounds = manuscript.submission_metadata?.peer_review?.rounds ?? [];
  if (rounds.length === 0) return undefined;
  return [...rounds]
    .sort((a, b) => b.round - a.round)
    .find((r) => r.editorDecision != null)
    ?.editorDecision;
}

function hasRevisionUploads(manuscript: Manuscript): boolean {
  return (manuscript.submission_metadata?.revision_cycle?.rounds?.length ?? 0) > 0;
}

function currentStageIndex(manuscript: Manuscript): number {
  const uploads = hasRevisionUploads(manuscript);
  const lastDecision = lastPeerReviewDecision(manuscript);

  switch (manuscript.status) {
    case "Pending Format Verification":
    case "Editor In Chief Screening":
      return 0;

    case "Peer Review":
    case "Peer Review in Progress":
      if (uploads && lastDecision === "minor-revision") return 5; // editor checking minor fixes
      return 1; // initial round or post-major-revision new round

    case "Review Conducted":
      return 2; // editor actively deciding; always Decision stage

    case "Editorial Review":
      return 3;

    case "Revision Requested":
    case "Returned to Author":
    case "Return to Revision":
      return 4;

    case "Checking":
      return 5;

    case "Accepted":
    case "In Layout":
    case "In Production":
    case "Published":
      return 6;

    case "Rejected":
      return -1;

    default:
      return 0;
  }
}

function buildStages(manuscript: Manuscript): Stage[] {
  const idx = currentStageIndex(manuscript);
  const isRejected = manuscript.status === "Rejected";
  const lastDecision = lastPeerReviewDecision(manuscript);

  // Major revision bypasses Editorial Review entirely
  const editorialSkipped =
    lastDecision === "major-revision" &&
    (manuscript.status === "Revision Requested" ||
      manuscript.status === "Returned to Author" ||
      manuscript.status === "Return to Revision");

  // Post-major-revision loop-back: manuscript is back in peer review with uploads
  const postMajorRevisionLoop =
    lastDecision === "major-revision" &&
    hasRevisionUploads(manuscript) &&
    (manuscript.status === "Peer Review" ||
      manuscript.status === "Peer Review in Progress" ||
      manuscript.status === "Review Conducted");

  return STAGE_KEYS.map((s, i) => {
    let state: StageState;

    if (isRejected && i === DECISION_IDX) {
      state = "rejected";
    } else if (isRejected && i < DECISION_IDX) {
      state = "completed";
    } else if (editorialSkipped && i === EDITORIAL_IDX) {
      state = "skipped";
    } else if (postMajorRevisionLoop && i === EDITORIAL_IDX) {
      // In the new peer review round; editorial review was skipped in prior cycle
      state = "skipped";
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
  const uploads = hasRevisionUploads(manuscript);
  const lastDecision = lastPeerReviewDecision(manuscript);

  switch (manuscript.status) {
    case "Pending Format Verification":
      return "Format Verification";
    case "Editor In Chief Screening":
      return "EIC Screening";
    case "Peer Review":
      if (uploads && lastDecision === "minor-revision") return "Checking";
      if (uploads) return "Peer Review (New Round)";
      return "Peer Review";
    case "Peer Review in Progress":
      if (uploads && lastDecision === "minor-revision") return "Checking";
      if (uploads) return "Peer Review in Progress (New Round)";
      return "Peer Review in Progress";
    case "Review Conducted":
      return "Awaiting Decision";
    case "Editorial Review":
      return "Editorial Review";
    case "Revision Requested":
      return lastDecision === "major-revision" ? "Major Revision" : "Revision";
    case "Returned to Author":
    case "Return to Revision":
      return "Revision";
    case "Checking":
      return "Final Checking";
    case "Accepted":
      return "Accepted";
    case "In Layout":
      return "In Layout";
    case "In Production":
      return "In Production";
    case "Published":
      return "For Layout and Proofreading";
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
    case "skipped":
      return "bg-gray-100 border-2 border-dashed border-gray-400";
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
    case "skipped":
      return "text-gray-400 line-through";
    default:
      return "text-gray-400";
  }
}

interface HistoryEvent {
  date: string;
  label: string;
  detail?: string;
  color: string;
}

function buildDecisionHistory(manuscript: Manuscript): HistoryEvent[] {
  const events: HistoryEvent[] = [];
  const meta = manuscript.submission_metadata;

  const decisionLabel: Record<string, string> = {
    "minor-revision": "Minor Revision",
    "major-revision": "Major Revision",
    "reject": "Rejected",
  };

  // Peer review rounds
  const rounds = meta?.peer_review?.rounds ?? [];
  for (const r of [...rounds].sort((a, b) => a.round - b.round)) {
    if (r.editorDecision && r.decidedAt) {
      events.push({
        date: r.decidedAt,
        label: `Round ${r.round} decision: ${decisionLabel[r.editorDecision] ?? r.editorDecision}`,
        color:
          r.editorDecision === "reject"
            ? "bg-red-400"
            : r.editorDecision === "major-revision"
            ? "bg-orange-400"
            : "bg-indigo-400",
      });
    }
  }

  // Revision submissions
  const revisions = meta?.revision_cycle?.rounds ?? [];
  for (const rv of [...revisions].sort((a, b) => a.round - b.round)) {
    events.push({
      date: rv.submittedAt,
      label: `Revision ${rv.round} submitted`,
      detail: rv.authorNote,
      color: "bg-amber-400",
    });
  }

  // Editorial review
  if (meta?.editorial_review?.reviewedAt) {
    events.push({
      date: meta.editorial_review.reviewedAt,
      label: "Editorial review sent to author",
      color: "bg-purple-400",
    });
  }

  // Checking review
  if (meta?.checking_review?.reviewedAt) {
    events.push({
      date: meta.checking_review.reviewedAt,
      label:
        meta.checking_review.decision === "approve"
          ? "Final check: Approved for layout & proofreading"
          : "Final check: Returned for minor revisions",
      color: meta.checking_review.decision === "approve" ? "bg-green-500" : "bg-orange-400",
    });
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

interface ManuscriptTrackerProps {
  manuscript: Manuscript;
}

export function ManuscriptTracker({ manuscript }: ManuscriptTrackerProps) {
  const stages = buildStages(manuscript);
  const stageLabel = currentStageLabel(manuscript);
  const audit = latestAuditEntry(manuscript);
  const isRejected = manuscript.status === "Rejected";
  const history = buildDecisionHistory(manuscript);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 text-sm mb-0.5">Revision tracker</h3>
      <p className="text-xs text-gray-500 mb-4">Track every stage your paper has gone through peer-review and revisions</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Pipeline */}
        <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-lg px-5 py-4">
          <div className="flex items-center pb-8">
            {stages.map((stage, i) => (
              <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                <div className="relative shrink-0">
                  <div className={`w-9 h-9 rounded-full ${nodeClass(stage.state)}`} />
                  <span
                    className={`absolute top-10 left-1/2 -translate-x-1/2 w-16 text-[10px] leading-tight text-center ${labelClass(stage.state)}`}
                  >
                    {stage.label}
                  </span>
                </div>
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
              { cls: "bg-gray-100 border-2 border-dashed border-gray-400", label: "Skipped" },
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

      {history.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-3">Decision history</p>
          <div className="relative space-y-3 pl-4">
            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-gray-200" />
            {history.map((event, i) => (
              <div key={i} className="relative flex gap-3">
                <div className={`absolute -left-[7px] top-[5px] w-2.5 h-2.5 rounded-full shrink-0 ${event.color} ring-2 ring-white`} />
                <div className="pl-3">
                  <p className="text-xs font-medium text-gray-800 leading-snug">{event.label}</p>
                  {event.detail && (
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{event.detail}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(event.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
