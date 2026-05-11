import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import type { AutomatedCheckSnapshot } from "@/types";
import { ManuscriptTracker } from "../components/ManuscriptTracker";
import { RevisionAutomatedChecks } from "../components/RevisionAutomatedChecks";
import {
  intakeReturnedAuthorResubmitGoesToFormatQueue,
  manuscriptAwaitingEditorialReReviewAfterRevision,
  manuscriptHasRevisionUploads,
  manuscriptNeedsCheckingDecision,
  manuscriptNeedsEditorialReview,
  manuscriptNeedsEditorToStartPostRevisionRound,
  manuscriptNeedsRevisionAction,
  useRevision,
} from "../hooks/useRevision";

function computeRevisionDeadline(
  manuscript: import("@/types").Manuscript,
): { deadline: Date; daysRemaining: number } | null {
  const meta = manuscript.submission_metadata;
  if (!meta) return null;
  const extensionPolicyDays = meta.revision_cycle?.extensionPolicyDays;
  if (!extensionPolicyDays) return null;

  const auditLogs = meta.audit_logs ?? [];
  const triggers = auditLogs
    .filter(
      (l) =>
        l.action === "revision-sent-to-author" ||
        l.action === "checking-sent-back",
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  let startDate: Date | null = null;
  if (triggers.length > 0) {
    startDate = new Date(triggers[0].createdAt);
  } else if (
    meta.checking_review?.decision === "send-back" &&
    meta.checking_review.reviewedAt
  ) {
    startDate = new Date(meta.checking_review.reviewedAt);
  } else if (meta.editorial_review?.reviewedAt) {
    startDate = new Date(meta.editorial_review.reviewedAt);
  }
  if (!startDate) return null;

  const grants = meta.revision_extension_grants?.length ?? 0;
  const totalDays = extensionPolicyDays * (1 + grants);
  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + totalDays);

  const msRemaining = deadline.getTime() - Date.now();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  return { deadline, daysRemaining };
}

const EDITOR_ROLES = new Set([
  "associate_editor",
  "managing_editor",
  "technical_editor",
  "editor_in_chief",
  "system_admin",
]);

const TECHNICAL_EDITOR_ROLES = new Set(["technical_editor", "system_admin"]);

export default function RevisionDashboard() {
  const { role } = useAuth();
  const {
    manuscripts,
    submitRevision,
    sendToAuthor,
    submitCheckingDecision,
    grantExtension,
  } = useRevision();
  const [selectedId, setSelectedId] = useState("");
  const [authorNote, setAuthorNote] = useState("");
  const [responseLetter, setResponseLetter] = useState("");
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionCheckResult, setRevisionCheckResult] = useState<{
    checks: AutomatedCheckSnapshot;
    pass: boolean;
    similarityScore: number;
  } | null>(null);
  const [extensionReason, setExtensionReason] = useState("");
  const [editorialSummary, setEditorialSummary] = useState("");
  const [editorialMajor, setEditorialMajor] = useState("");
  const [editorialMinor, setEditorialMinor] = useState("");
  const [checkingSummary, setCheckingSummary] = useState("");
  const [checkingMajor, setCheckingMajor] = useState("");
  const [checkingMinor, setCheckingMinor] = useState("");

  const onRevisionChecksResult = useCallback(
    (
      r: {
        checks: AutomatedCheckSnapshot;
        pass: boolean;
        similarityScore: number;
      } | null,
    ) => {
      setRevisionCheckResult(r);
    },
    [],
  );

  const selected = useMemo(
    () => manuscripts.find((m) => m.id === selectedId) ?? manuscripts[0],
    [manuscripts, selectedId],
  );

  const selectedNeedsEditorialReview = selected
    ? manuscriptNeedsEditorialReview(selected)
    : false;
  const selectedNeedsCheckingDecision = selected
    ? manuscriptNeedsCheckingDecision(selected)
    : false;
  const selectedNeedsAction = selected
    ? manuscriptNeedsRevisionAction(selected)
    : false;
  const selectedHasUploads = selected
    ? manuscriptHasRevisionUploads(selected)
    : false;
  const selectedPostRevisionPeerReview = selected
    ? manuscriptAwaitingEditorialReReviewAfterRevision(selected)
    : false;
  const isEditorialUser = role ? EDITOR_ROLES.has(role) : false;
  const isTechnicalEditor = role ? TECHNICAL_EDITOR_ROLES.has(role) : false;

  const revisionRounds =
    selected?.submission_metadata?.revision_cycle?.rounds ?? [];
  const extensionGrants =
    selected?.submission_metadata?.revision_extension_grants ?? [];
  const selectedIntakeFormatResubmit = selected
    ? intakeReturnedAuthorResubmitGoesToFormatQueue(selected)
    : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Revision Cycle</h1>
          <p className="text-gray-600 mt-1">
            Manage author revisions and editorial decisions. After a{" "}
            <strong>minor revision</strong> decision, the Technical Editor
            reviews the manuscript and the author submits a revised file for
            final checking. After a <strong>major revision</strong> decision,
            the manuscript returns to a new peer review round.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Revision queue and history
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            Manuscripts currently under revision or peer review. Completed
            manuscripts are removed automatically.
          </p>
          <div className="space-y-2">
            {manuscripts.map((m) => {
              const needs = manuscriptNeedsRevisionAction(m);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full text-left p-3 border rounded ${
                    (selected?.id ?? manuscripts[0]?.id) === m.id
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {m.reference_code ?? m.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {m.title}
                  </p>
                  <p className="text-xs mt-1">
                    {manuscriptNeedsEditorialReview(m) ? (
                      <span className="text-purple-700 font-medium">
                        Editorial action required
                      </span>
                    ) : manuscriptNeedsCheckingDecision(m) ? (
                      <span className="text-teal-700 font-medium">
                        Final checking required
                      </span>
                    ) : needs ? (
                      <span className="text-amber-800 font-medium">
                        Action required
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        History · {m.status}
                      </span>
                    )}
                  </p>
                </button>
              );
            })}
            {manuscripts.length === 0 && (
              <p className="text-sm text-gray-500">
                No revision activity yet for your account.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2 space-y-5">
          {!selected ? (
            <p className="text-sm text-gray-500">
              Select a manuscript to open revision actions.
            </p>
          ) : (
            <>
              <ManuscriptTracker manuscript={selected} />

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selected.title}
                </h2>
                <p className="text-sm text-gray-600">
                  Current status: {selected.status}
                </p>
                {selectedNeedsAction &&
                  (() => {
                    const dl = computeRevisionDeadline(selected);
                    if (!dl) return null;
                    const isOverdue = dl.daysRemaining <= 0;
                    const isUrgent = !isOverdue && dl.daysRemaining <= 3;
                    const colors = isOverdue
                      ? {
                          wrap: "bg-red-50 border-red-200 text-red-800",
                          badge: "bg-red-100 text-red-900",
                        }
                      : isUrgent
                        ? {
                            wrap: "bg-amber-50 border-amber-200 text-amber-800",
                            badge: "bg-amber-100 text-amber-900",
                          }
                        : {
                            wrap: "bg-green-50 border-green-200 text-green-800",
                            badge: "bg-green-100 text-green-900",
                          };
                    const label = isOverdue
                      ? "Overdue"
                      : dl.daysRemaining === 1
                        ? "1 day left"
                        : `${dl.daysRemaining} days remaining`;
                    return (
                      <div
                        className={`mt-2 flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm ${colors.wrap}`}
                      >
                        <span>
                          Revision due by{" "}
                          <strong>
                            {dl.deadline.toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </strong>
                        </span>
                        <span
                          className={`ml-3 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })()}
                {selectedPostRevisionPeerReview && (
                  <div className="text-sm text-gray-800 mt-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 space-y-2">
                    <p className="font-medium text-indigo-950">
                      Back in peer review — major revision round
                    </p>
                    {selected &&
                      manuscriptNeedsEditorToStartPostRevisionRound(
                        selected,
                      ) && (
                        <p>
                          The revised manuscript has been submitted. Editors
                          must <strong>open the next peer review round</strong>{" "}
                          in the Peer Review workspace to begin inviting
                          reviewers for the new version.
                        </p>
                      )}
                    {selected &&
                      !manuscriptNeedsEditorToStartPostRevisionRound(
                        selected,
                      ) &&
                      selected.status === "Peer Review" && (
                        <p>
                          The new peer review round is open. Reviewers are being
                          invited for the revised file.
                        </p>
                      )}
                    <p>
                      After reviews are submitted, the editor records a decision
                      — minor revision, major revision, or reject.
                    </p>
                    {role === "author" && (
                      <p className="text-indigo-900">
                        You will be notified when the desk requires further
                        action. Track your manuscript from{" "}
                        <Link
                          to="/author"
                          className="font-medium underline underline-offset-2"
                        >
                          My submissions
                        </Link>
                        .
                      </p>
                    )}
                    {isEditorialUser && (
                      <p>
                        <Link
                          to="/peer-review"
                          className="font-medium text-indigo-800 underline underline-offset-2"
                        >
                          Open Peer Review workspace
                        </Link>{" "}
                        to start the new round, invite reviewers, and record a
                        decision once reviews are in.
                      </p>
                    )}
                  </div>
                )}
                {!selectedNeedsAction &&
                  selectedHasUploads &&
                  !selectedPostRevisionPeerReview && (
                    <p className="text-sm text-gray-700 mt-2 rounded-md bg-slate-100 border border-slate-200 px-3 py-2">
                      Revision history is on record. No further action is
                      required at this stage — current status:{" "}
                      <strong>{selected.status}</strong>.
                    </p>
                  )}
              </div>

              {role === "author" &&
                (() => {
                  const rounds =
                    selected.submission_metadata?.peer_review?.rounds ?? [];
                  const decidedRounds = rounds
                    .filter((r) => r.submissions.length > 0 || r.editorDecision)
                    .sort((a, b) => a.round - b.round);
                  const editorialReview =
                    selected.submission_metadata?.editorial_review;
                  const checkingReview =
                    selected.submission_metadata?.checking_review;
                  if (
                    decidedRounds.length === 0 &&
                    !editorialReview &&
                    !checkingReview
                  )
                    return null;

                  const recommendationLabel: Record<string, string> = {
                    accept: "Accept",
                    "minor-revision": "Minor Revision",
                    "major-revision": "Major Revision",
                    reject: "Reject",
                  };
                  const decisionLabel: Record<string, string> = {
                    "minor-revision": "Minor Revision",
                    "major-revision": "Major Revision",
                    reject: "Rejected",
                  };

                  return (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Peer review feedback
                      </h3>
                      <div className="space-y-4">
                        {decidedRounds.map((r) => (
                          <div
                            key={r.round}
                            className="border border-indigo-100 rounded-lg overflow-hidden"
                          >
                            <div className="bg-indigo-50 px-4 py-2 flex items-center justify-between">
                              <p className="text-sm font-medium text-indigo-900">
                                Round {r.round}
                              </p>
                              {r.editorDecision && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                  Decision:{" "}
                                  {decisionLabel[r.editorDecision] ??
                                    r.editorDecision}
                                </span>
                              )}
                            </div>
                            {r.submissions.length > 0 ? (
                              <div className="divide-y divide-gray-100">
                                {r.submissions.map((s, i) => (
                                  <div
                                    key={s.id}
                                    className="px-4 py-3 space-y-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-medium text-gray-700">
                                        Reviewer {i + 1}
                                      </p>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                        {recommendationLabel[
                                          s.recommendation
                                        ] ?? s.recommendation}
                                      </span>
                                    </div>
                                    {s.summary && (
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                          Summary
                                        </p>
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                          {s.summary}
                                        </p>
                                      </div>
                                    )}
                                    {s.majorConcerns && (
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                          Major concerns
                                        </p>
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                          {s.majorConcerns}
                                        </p>
                                      </div>
                                    )}
                                    {s.minorConcerns && (
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                          Minor concerns
                                        </p>
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                          {s.minorConcerns}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="px-4 py-3 text-xs text-gray-500">
                                No reviewer submissions yet for this round.
                              </p>
                            )}
                          </div>
                        ))}

                        {editorialReview && (
                          <div className="border border-purple-100 rounded-lg overflow-hidden">
                            <div className="bg-purple-50 px-4 py-2">
                              <p className="text-sm font-medium text-purple-900">
                                Editorial Review
                              </p>
                              {editorialReview.reviewedAt && (
                                <p className="text-[10px] text-purple-500 mt-0.5">
                                  {new Date(
                                    editorialReview.reviewedAt,
                                  ).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                            <div className="px-4 py-3 space-y-2">
                              {editorialReview.summary && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                    Summary
                                  </p>
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {editorialReview.summary}
                                  </p>
                                </div>
                              )}
                              {editorialReview.majorConcerns && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                    Major concerns
                                  </p>
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {editorialReview.majorConcerns}
                                  </p>
                                </div>
                              )}
                              {editorialReview.minorConcerns && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                    Minor concerns
                                  </p>
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {editorialReview.minorConcerns}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {checkingReview && (
                          <div className="border border-teal-100 rounded-lg overflow-hidden">
                            <div className="bg-teal-50 px-4 py-2 flex items-center justify-between">
                              <p className="text-sm font-medium text-teal-900">
                                Final Check
                              </p>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${checkingReview.decision === "approve" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}
                              >
                                {checkingReview.decision === "approve"
                                  ? "Approved"
                                  : "Sent back"}
                              </span>
                            </div>
                            <div className="px-4 py-3 space-y-2">
                              {checkingReview.summary && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                    Summary
                                  </p>
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {checkingReview.summary}
                                  </p>
                                </div>
                              )}
                              {checkingReview.majorConcerns && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                    Major concerns
                                  </p>
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {checkingReview.majorConcerns}
                                  </p>
                                </div>
                              )}
                              {checkingReview.minorConcerns && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                    Minor concerns
                                  </p>
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {checkingReview.minorConcerns}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              {isEditorialUser &&
                (() => {
                  const rounds =
                    selected.submission_metadata?.peer_review?.rounds ?? [];
                  const decidedRounds = rounds
                    .filter((r) => r.submissions.length > 0 || r.editorDecision)
                    .sort((a, b) => a.round - b.round);
                  if (decidedRounds.length === 0) return null;

                  const recommendationLabel: Record<string, string> = {
                    accept: "Accept",
                    "minor-revision": "Minor Revision",
                    "major-revision": "Major Revision",
                    reject: "Reject",
                  };
                  const decisionLabel: Record<string, string> = {
                    "minor-revision": "Minor Revision",
                    "major-revision": "Major Revision",
                    reject: "Rejected",
                  };

                  return (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Peer review feedback
                      </h3>
                      <div className="space-y-4">
                        {decidedRounds.map((r) => (
                          <div
                            key={r.round}
                            className="border border-indigo-100 rounded-lg overflow-hidden"
                          >
                            <div className="bg-indigo-50 px-4 py-2 flex items-center justify-between">
                              <p className="text-sm font-medium text-indigo-900">
                                Round {r.round}
                              </p>
                              {r.editorDecision && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                  Decision:{" "}
                                  {decisionLabel[r.editorDecision] ??
                                    r.editorDecision}
                                </span>
                              )}
                            </div>
                            {r.submissions.length > 0 ? (
                              <div className="divide-y divide-gray-100">
                                {r.submissions.map((s, i) => (
                                  <div
                                    key={s.id}
                                    className="px-4 py-3 space-y-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-xs font-medium text-gray-700">
                                          {r.invitations.find(
                                            (inv) => inv.id === s.invitationId,
                                          )?.reviewerName ||
                                            `Reviewer ${i + 1}`}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                          {s.reviewerEmail}
                                        </p>
                                      </div>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                        {recommendationLabel[
                                          s.recommendation
                                        ] ?? s.recommendation}
                                      </span>
                                    </div>
                                    {s.summary && (
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                          Summary
                                        </p>
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                          {s.summary}
                                        </p>
                                      </div>
                                    )}
                                    {s.majorConcerns && (
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                          Major concerns
                                        </p>
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                          {s.majorConcerns}
                                        </p>
                                      </div>
                                    )}
                                    {s.minorConcerns && (
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                                          Minor concerns
                                        </p>
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                          {s.minorConcerns}
                                        </p>
                                      </div>
                                    )}
                                    {s.confidentialToEditor?.trim() ? (
                                      <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 mt-1">
                                        <p className="text-[10px] uppercase tracking-wide text-amber-700 mb-0.5 font-semibold">
                                          Confidential to editor
                                        </p>
                                        <p className="text-xs text-amber-900 whitespace-pre-wrap">
                                          {s.confidentialToEditor}
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="px-4 py-3 text-xs text-gray-500">
                                No reviewer submissions yet for this round.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Revision uploads (one row per file)
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  Each version is stored when you upload a revised manuscript;
                  extensions are listed separately.
                </p>
                <div className="space-y-2">
                  {revisionRounds.map((round) => (
                    <div
                      key={round.id}
                      className="border border-gray-200 rounded p-3"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        Revision {round.round}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(round.submittedAt).toLocaleString()}
                      </p>
                      {round.fileUrl ? (
                        <a
                          href={round.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-700 hover:underline mt-1 inline-block"
                        >
                          Open revised manuscript file
                        </a>
                      ) : null}
                      <p className="text-sm text-gray-700 mt-1">
                        {round.authorNote}
                      </p>
                      {round.responseLetter ? (
                        <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap border-t border-gray-100 pt-2">
                          {round.responseLetter}
                        </p>
                      ) : null}
                      {round.extensionGranted && (
                        <p className="text-xs text-amber-700 mt-1">
                          Extension granted (legacy):{" "}
                          {round.extensionReason ?? "No reason recorded"}
                        </p>
                      )}
                    </div>
                  ))}
                  {revisionRounds.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No revision upload recorded yet.
                    </p>
                  )}
                </div>
              </div>

              {extensionGrants.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Deadline extensions
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {extensionGrants.map((g) => (
                      <li
                        key={g.id}
                        className="border border-amber-100 bg-amber-50/50 rounded p-3"
                      >
                        <p className="text-xs text-gray-600">
                          {new Date(g.grantedAt).toLocaleString()}
                        </p>
                        <p className="text-gray-800 mt-1">{g.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {role === "author" &&
                selectedNeedsAction &&
                selectedIntakeFormatResubmit && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
                    <p className="font-medium">Intake resubmission</p>
                    <p className="mt-1 text-amber-900">
                      You have not yet entered external peer review for this
                      manuscript. After you submit the revised file and checks
                      pass, it will return to the{" "}
                      <strong>format verification</strong> queue—not directly to
                      reviewers.
                    </p>
                  </div>
                )}

              {role === "author" && selectedNeedsAction && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Submit revised manuscript
                  </h3>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">
                      Revised manuscript file (PDF)
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4"
                        />
                      </svg>
                      Choose file
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="sr-only"
                        onChange={(e) => {
                          setRevisionFile(e.target.files?.[0] ?? null);
                          setRevisionCheckResult(null);
                        }}
                      />
                    </label>
                    {revisionFile && (
                      <p className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {revisionFile.name}
                      </p>
                    )}
                  </div>
                  <RevisionAutomatedChecks
                    file={revisionFile}
                    manuscriptKey={selected.id}
                    onResult={onRevisionChecksResult}
                  />
                  <textarea
                    value={authorNote}
                    onChange={(e) => setAuthorNote(e.target.value)}
                    placeholder="Revision summary"
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <textarea
                    value={responseLetter}
                    onChange={(e) => setResponseLetter(e.target.value)}
                    placeholder="Response-to-reviewers letter (optional; can also attach in PDF only)"
                    rows={4}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <button
                    type="button"
                    disabled={
                      !authorNote.trim() ||
                      !revisionFile ||
                      !revisionCheckResult?.pass
                    }
                    onClick={() =>
                      void (async () => {
                        if (!revisionFile || !revisionCheckResult?.pass) return;
                        const ok = await submitRevision(selected, {
                          authorNote,
                          responseLetter: responseLetter.trim() || undefined,
                          file: revisionFile,
                          automatedChecks: revisionCheckResult.checks,
                          similarityScore: revisionCheckResult.similarityScore,
                        });
                        if (ok) {
                          setAuthorNote("");
                          setResponseLetter("");
                          setRevisionFile(null);
                          setRevisionCheckResult(null);
                        }
                      })()
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Submit revision
                  </button>
                </div>
              )}

              {selectedNeedsEditorialReview && !isTechnicalEditor && (
                <div className="rounded-lg border border-purple-100 bg-purple-50/60 px-4 py-3 text-sm text-purple-800">
                  <p className="font-medium">Editorial review pending</p>
                  <p className="mt-1">
                    This manuscript is awaiting editorial review by the
                    Technical Editor before it can be returned to the author.
                  </p>
                </div>
              )}

              {isTechnicalEditor && selectedNeedsEditorialReview && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-purple-900">
                      Editorial Review
                    </h3>
                    <p className="text-sm text-purple-800 mt-1">
                      Complete the editorial review below. Submitting will
                      notify the author and open the revision window.
                    </p>
                  </div>
                  <label className="block text-sm text-gray-700">
                    Summary
                    <textarea
                      value={editorialSummary}
                      onChange={(e) => setEditorialSummary(e.target.value)}
                      placeholder="Overall assessment of the manuscript"
                      rows={3}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm text-gray-700">
                    Major concerns
                    <textarea
                      value={editorialMajor}
                      onChange={(e) => setEditorialMajor(e.target.value)}
                      placeholder="Issues that must be addressed before acceptance"
                      rows={3}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm text-gray-700">
                    Minor concerns
                    <textarea
                      value={editorialMinor}
                      onChange={(e) => setEditorialMinor(e.target.value)}
                      placeholder="Suggestions and non-blocking improvements"
                      rows={2}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={
                      !editorialSummary.trim() || !editorialMajor.trim()
                    }
                    onClick={() =>
                      void sendToAuthor(selected, {
                        summary: editorialSummary,
                        majorConcerns: editorialMajor,
                        minorConcerns: editorialMinor,
                      }).then((ok) => {
                        if (ok) {
                          setEditorialSummary("");
                          setEditorialMajor("");
                          setEditorialMinor("");
                        }
                      })
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-purple-800 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Submit review &amp; send to author
                  </button>
                </div>
              )}

              {selectedNeedsCheckingDecision &&
                !isTechnicalEditor &&
                isEditorialUser && (
                  <div className="rounded-lg border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-teal-800">
                    <p className="font-medium">Final checking pending</p>
                    <p className="mt-1">
                      This manuscript is awaiting the Technical Editor's final
                      1-week check before it can be accepted or returned.
                    </p>
                  </div>
                )}

              {isTechnicalEditor && selectedNeedsCheckingDecision && (
                <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-teal-900">
                      Final Checking Review
                    </h3>
                    <p className="text-sm text-teal-800 mt-1">
                      The author has submitted their revised manuscript.
                      Complete the final review and decide to approve or return
                      for further revisions.
                    </p>
                  </div>
                  <label className="block text-sm text-gray-700">
                    Summary
                    <textarea
                      value={checkingSummary}
                      onChange={(e) => setCheckingSummary(e.target.value)}
                      placeholder="Overall assessment of the revised manuscript"
                      rows={3}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm text-gray-700">
                    Major concerns
                    <textarea
                      value={checkingMajor}
                      onChange={(e) => setCheckingMajor(e.target.value)}
                      placeholder="Any remaining issues (leave blank if none)"
                      rows={3}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm text-gray-700">
                    Minor concerns
                    <textarea
                      value={checkingMinor}
                      onChange={(e) => setCheckingMinor(e.target.value)}
                      placeholder="Suggestions and non-blocking improvements (optional)"
                      rows={2}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      disabled={!checkingSummary.trim()}
                      onClick={() =>
                        void submitCheckingDecision(selected, "approve", {
                          summary: checkingSummary,
                          majorConcerns: checkingMajor,
                          minorConcerns: checkingMinor,
                        }).then((ok) => {
                          if (ok) {
                            setCheckingSummary("");
                            setCheckingMajor("");
                            setCheckingMinor("");
                          }
                        })
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-teal-800 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Approve for layout &amp; proofreading
                    </button>
                    <button
                      type="button"
                      disabled={!checkingSummary.trim()}
                      onClick={() =>
                        void submitCheckingDecision(selected, "send-back", {
                          summary: checkingSummary,
                          majorConcerns: checkingMajor,
                          minorConcerns: checkingMinor,
                        }).then((ok) => {
                          if (ok) {
                            setCheckingSummary("");
                            setCheckingMajor("");
                            setCheckingMinor("");
                          }
                        })
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Send back for minor revisions
                    </button>
                  </div>
                </div>
              )}

              {isEditorialUser && selectedNeedsAction && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Grant extension
                  </h3>
                  <textarea
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    placeholder="Reason for extension"
                    rows={2}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <button
                    type="button"
                    disabled={!extensionReason.trim()}
                    onClick={() =>
                      void grantExtension(selected, extensionReason).then(
                        (ok) => {
                          if (ok) setExtensionReason("");
                        },
                      )
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Grant extension
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
