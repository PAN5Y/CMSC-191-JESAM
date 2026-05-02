import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { usePeerReview } from "../hooks/usePeerReview";
import {
  manuscriptAwaitingEditorialReReviewAfterRevision,
  manuscriptHasRevisionUploads,
  manuscriptNeedsEditorToStartPostRevisionRound,
} from "@/modules/revision/hooks/useRevision";
import { Loader2 } from "lucide-react";
import type {
  Manuscript,
  PeerReviewRound,
  ReviewInvitation,
  ReviewerRecommendation,
  ReviewSubmission,
} from "@/types";
import { PEER_REVIEW_TARGET_COUNT } from "@/lib/workflow";
import { listReviewerCandidatesFromDb } from "@/lib/reviewer-directory-db";
import {
  REVIEWER_CANDIDATE_POOL,
  pickNextSuggestedReviewer,
  rankReviewersForManuscript,
  type ReviewerCandidate,
} from "@/lib/reviewer-suggestions";

function recommendationShortLabel(r: ReviewerRecommendation): string {
  switch (r) {
    case "accept":
      return "Recommend accept";
    case "minor-revision":
      return "Minor revision";
    case "major-revision":
      return "Major revision";
    case "reject":
      return "Recommend reject";
    default:
      return r;
  }
}

function invitationStatusCounts(invitations: ReviewInvitation[]) {
  const counts = { invited: 0, accepted: 0, declined: 0, expired: 0 };
  for (const inv of invitations) {
    if (inv.status === "invited") counts.invited += 1;
    else if (inv.status === "accepted") counts.accepted += 1;
    else if (inv.status === "declined") counts.declined += 1;
    else if (inv.status === "expired") counts.expired += 1;
  }
  return counts;
}

function invitationForSubmission(
  invitations: ReviewInvitation[],
  submission: ReviewSubmission
): ReviewInvitation | undefined {
  return invitations.find((i) => i.id === submission.invitationId);
}

function editorDecisionLabel(d: NonNullable<PeerReviewRound["editorDecision"]>): string {
  switch (d) {
    case "accept":
      return "Accept manuscript";
    case "revise":
      return "Request revision";
    case "reject":
      return "Reject";
    case "additional-reviewer":
      return "Request additional reviewer (new round)";
    default:
      return d;
  }
}

function SubmissionReviewCard({
  sub,
  invitations,
}: {
  sub: ReviewSubmission;
  invitations: ReviewInvitation[];
}) {
  const inv = invitationForSubmission(invitations, sub);
  return (
    <li className="border border-gray-200 rounded-lg p-4 bg-white space-y-3 text-sm shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-2">
        <div>
          <p className="font-medium text-gray-900">
            {inv?.reviewerName?.trim() ? inv.reviewerName : sub.reviewerEmail}
          </p>
          <p className="text-xs text-gray-500">{sub.reviewerEmail}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</p>
          <p className="text-sm font-medium text-blue-900 mt-0.5">
            {recommendationShortLabel(sub.recommendation)}
          </p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary</p>
        <p className="text-gray-800 whitespace-pre-wrap">{sub.summary}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Major concerns</p>
        <p className="text-gray-800 whitespace-pre-wrap">{sub.majorConcerns}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Minor concerns</p>
        <p className="text-gray-800 whitespace-pre-wrap">{sub.minorConcerns}</p>
      </div>
      {sub.confidentialToEditor?.trim() ? (
        <div className="rounded-md bg-amber-50 border border-amber-100 p-3">
          <p className="text-xs font-semibold text-amber-900 mb-1">Confidential to editor</p>
          <p className="text-amber-950 whitespace-pre-wrap">{sub.confidentialToEditor}</p>
        </div>
      ) : null}
    </li>
  );
}

function PriorRoundDecisionSummary({ round }: { round: PeerReviewRound }) {
  if (!round.editorDecision) {
    return (
      <p className="text-xs text-gray-500 mb-3 italic">No editorial decision recorded for this round.</p>
    );
  }
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 space-y-2 text-sm mb-4">
      <p className="font-medium text-emerald-950">Editorial decision (historical)</p>
      <p className="text-gray-900">
        <span className="text-gray-600">Outcome:</span> {editorDecisionLabel(round.editorDecision)}
      </p>
      {round.editorDecisionNote?.trim() ? (
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Rationale</p>
          <p className="text-gray-800 whitespace-pre-wrap">{round.editorDecisionNote}</p>
        </div>
      ) : null}
      {round.decidedAt ? (
        <p className="text-xs text-gray-600">Recorded {new Date(round.decidedAt).toLocaleString()}</p>
      ) : null}
    </div>
  );
}

function RoundSubmittedReviewsList({ round }: { round: PeerReviewRound }) {
  if (round.submissions.length === 0) {
    return (
      <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4 bg-white/80">
        No submitted reviews in this round.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {round.submissions.map((sub) => (
        <SubmissionReviewCard key={sub.id} sub={sub} invitations={round.invitations} />
      ))}
    </ul>
  );
}

export default function PeerReviewDashboard() {
  const {
    manuscripts,
    initializeRound,
    addInvitation,
    makeEditorialDecision,
    startPostRevisionPeerReviewRound,
    sendReviewReminder,
  } = usePeerReview();
  const [reviewerPool, setReviewerPool] = useState<ReviewerCandidate[]>([]);
  const [poolReady, setPoolReady] = useState(false);
  const [reviewerSource, setReviewerSource] = useState<"database" | "fallback">("fallback");
  const [selectedId, setSelectedId] = useState<string>("");
  const [decision, setDecision] = useState<"accept" | "revise" | "reject" | "additional-reviewer">(
    "revise"
  );
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [postRevisionRoundSubmitting, setPostRevisionRoundSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await listReviewerCandidatesFromDb();
      if (cancelled) return;
      if (error) {
        toast.message(`Reviewer directory unavailable (${error.message}). Using demo fallback list.`);
        setReviewerPool(REVIEWER_CANDIDATE_POOL);
        setReviewerSource("fallback");
      } else if (data.length > 0) {
        setReviewerPool(data);
        setReviewerSource("database");
      } else {
        toast.message("No registered reviewers — add users with role reviewer, or use demo fallback.");
        setReviewerPool(REVIEWER_CANDIDATE_POOL);
        setReviewerSource("fallback");
      }
      setPoolReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => manuscripts.find((m) => m.id === selectedId) ?? manuscripts[0],
    [manuscripts, selectedId]
  );

  /** Matches merge in `mergePeerReviewIntoManuscripts` (column overrides JSON mirror). */
  const activeRound =
    selected?.peer_review_active_round ??
    selected?.submission_metadata?.peer_review?.activeRound ??
    1;

  const peerRounds = selected?.submission_metadata?.peer_review?.rounds;
  const allRounds = peerRounds ?? [];

  const roundData = allRounds.find((r) => r.round === activeRound);

  const priorRounds = useMemo(() => {
    const rounds = peerRounds ?? [];
    return rounds.filter((r) => r.round < activeRound).sort((a, b) => a.round - b.round);
  }, [peerRounds, activeRound]);

  /** App policy: editorial decision is gated on this many submitted reviews (not legacy DB target). */
  const reviewsRequiredForDecision = PEER_REVIEW_TARGET_COUNT;
  const storedRoundTarget = roundData?.targetReviewerCount ?? PEER_REVIEW_TARGET_COUNT;
  /** Legacy metadata may still say 3; relational rows are clamped in merge from DB. */
  const dbRoundTargetExceedsPolicy =
    roundData != null && storedRoundTarget > reviewsRequiredForDecision;

  const recommendationCounts = (roundData?.submissions ?? []).reduce<
    Record<ReviewerRecommendation, number>
  >(
    (acc, review) => {
      acc[review.recommendation] += 1;
      return acc;
    },
    { accept: 0, "minor-revision": 0, "major-revision": 0, reject: 0 }
  );

  const submittedReviews = roundData?.submissions.length ?? 0;
  const canDecide = submittedReviews >= reviewsRequiredForDecision;

  const roundDecisionLocked = Boolean(roundData?.editorDecision);

  const acceptRejectConflict = useMemo(() => {
    const subs = roundData?.submissions ?? [];
    if (subs.length < reviewsRequiredForDecision) return false;
    const recs = new Set(subs.map((s) => s.recommendation));
    return recs.has("accept") && recs.has("reject");
  }, [roundData?.submissions, reviewsRequiredForDecision]);

  const invitationCounts = useMemo(
    () => invitationStatusCounts(roundData?.invitations ?? []),
    [roundData?.invitations]
  );

  const recommendationTileOrder: ReviewerRecommendation[] = [
    "accept",
    "minor-revision",
    "major-revision",
    "reject",
  ];

  const invitedEmails = useMemo(() => {
    const set = new Set<string>();
    (roundData?.invitations ?? []).forEach((i) => set.add(i.reviewerEmail.toLowerCase()));
    return set;
  }, [roundData?.invitations]);

  const rankedSuggestions = useMemo(() => {
    if (!selected || !poolReady) return [];
    return rankReviewersForManuscript(selected, invitedEmails, reviewerPool).slice(0, 5);
  }, [selected, invitedEmails, reviewerPool, poolReady]);

  const handleInviteSuggested = async (
    manuscript: Manuscript,
    preset: (typeof rankedSuggestions)[number]
  ) => {
    if (!manuscript.submission_metadata?.peer_review) {
      await initializeRound(manuscript);
    }
    const { matchScore: _m, ...invitePayload } = preset;
    await addInvitation(manuscript, invitePayload);
  };

  const handleInviteNext = async (manuscript: Manuscript) => {
    const ar =
      manuscript.peer_review_active_round ??
      manuscript.submission_metadata?.peer_review?.activeRound ??
      1;
    const rd = manuscript.submission_metadata?.peer_review?.rounds.find((r) => r.round === ar);
    const next = pickNextSuggestedReviewer(manuscript, rd?.invitations ?? [], reviewerPool);
    if (!next) {
      toast.message("No more suggested reviewers in the directory.");
      return;
    }
    if (!manuscript.submission_metadata?.peer_review) {
      await initializeRound(manuscript);
    }
    await addInvitation(manuscript, next);
  };

  const revisionRoundCount =
    selected?.submission_metadata?.revision_cycle?.rounds?.length ?? 0;
  const manuscriptFileVersionLabel =
    revisionRoundCount > 0 ? revisionRoundCount + 1 : 1;

  const handleStartPostRevisionRound = async () => {
    if (!selected || postRevisionRoundSubmitting) return;
    setPostRevisionRoundSubmitting(true);
    try {
      const ok = await startPostRevisionPeerReviewRound(selected);
      if (ok) toast.success(`Peer review round ${activeRound + 1} opened. Invite reviewers below.`);
    } finally {
      setPostRevisionRoundSubmitting(false);
    }
  };

  const handleSaveEditorialDecision = async () => {
    if (!selected || roundDecisionLocked || decisionSubmitting) return;
    if (!decisionNote.trim()) {
      toast.error("Add an editorial rationale before saving.");
      return;
    }
    if (!canDecide) {
      toast.error(
        `At least ${reviewsRequiredForDecision} submitted reviews are required before saving a decision.`
      );
      return;
    }
    setDecisionSubmitting(true);
    try {
      const ok = await makeEditorialDecision(selected, decision, decisionNote);
      if (ok) toast.success("Editorial decision saved.");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Peer Review Operations</h1>
          <p className="text-gray-600 mt-2 max-w-3xl leading-relaxed">
            Assign reviewers, track invitations, and read structured reviews. After authors submit a{" "}
            <strong>revision</strong>, use <strong>Start post-revision peer-review round</strong> when you
            are ready for reviewers to evaluate the new file (§2.5); then invite reviewers for that new
            round. Each round requires <strong>{PEER_REVIEW_TARGET_COUNT}</strong> submitted
            reviews before you can save a decision (proposal §2.4). <strong>Request additional reviewer</strong>{" "}
            opens a <em>new round</em> with the same per-round minimum—not an extra slot inside the current
            round.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:col-span-4">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
            Manuscripts in review
          </h2>
          <div className="space-y-2">
            {manuscripts.map((m) => {
              const r =
                m.peer_review_active_round ?? m.submission_metadata?.peer_review?.activeRound ?? 1;
              const postRevision = manuscriptAwaitingEditorialReReviewAfterRevision(m);
              const needsPostRevisionRound = manuscriptNeedsEditorToStartPostRevisionRound(m);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    (selected?.id ?? manuscripts[0]?.id) === m.id
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {m.reference_code ?? m.id.slice(0, 8)}
                    </p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        R{r}
                      </span>
                      {needsPostRevisionRound ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-950">
                          Start round
                        </span>
                      ) : postRevision ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-violet-100 text-violet-900">
                          Post-revision
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{m.title}</p>
                </button>
              );
            })}
            {manuscripts.length === 0 && (
              <p className="text-sm text-gray-500">No peer-review manuscripts.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-8">
          {!selected ? (
            <p className="text-sm text-gray-500">Select a manuscript to continue.</p>
          ) : (
            <div className="space-y-8">
              <header className="border-b border-gray-100 pb-4">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                  {selected.reference_code ?? selected.id.slice(0, 8)}
                </p>
                <h2 className="text-xl font-semibold text-gray-900 leading-snug">{selected.title}</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Peer-review history and the <strong>active</strong> round are on this page. When present,
                  earlier rounds are shown first; scroll down for current invitations and decisions.
                </p>
                {selected.file_url ? (
                  <div className="mt-3 text-sm">
                    <span className="text-gray-600">Current manuscript file (version {manuscriptFileVersionLabel}): </span>
                    <a
                      href={selected.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-700 hover:underline"
                    >
                      Open PDF
                    </a>
                    {manuscriptHasRevisionUploads(selected) ? (
                      <span className="text-gray-500 text-xs ml-2">
                        ({revisionRoundCount} revision upload{revisionRoundCount === 1 ? "" : "s"} on file)
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {manuscriptAwaitingEditorialReReviewAfterRevision(selected) ? (
                  <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/90 px-4 py-3 text-sm text-violet-950 space-y-3">
                    <p className="font-semibold">Author revision received — your handling stage</p>
                    {manuscriptNeedsEditorToStartPostRevisionRound(selected) ? (
                      <>
                        <p>
                          The author passed automated checks and uploaded a revised file. The active peer-review
                          round still reflects the earlier <strong>revise</strong> decision. When you are ready
                          for reviewers to evaluate the new version (proposal §2.5), open the next round—then
                          invite reviewers for <strong>round {activeRound + 1}</strong>.
                        </p>
                        <p>
                          Version history:{" "}
                          <Link
                            to="/revision"
                            className="font-medium underline underline-offset-2 text-violet-900"
                          >
                            Revision cycle
                          </Link>
                          .
                        </p>
                        <button
                          type="button"
                          disabled={postRevisionRoundSubmitting}
                          onClick={() => void handleStartPostRevisionRound()}
                          className="px-4 py-2 rounded-md bg-violet-800 text-white text-sm font-medium hover:bg-violet-900 disabled:opacity-60"
                        >
                          {postRevisionRoundSubmitting ? "Opening…" : "Start post-revision peer-review round"}
                        </button>
                      </>
                    ) : (
                      <p>
                        Post-revision peer review is active for <strong>round {activeRound}</strong>. Use the
                        sections below to invite reviewers and collect structured reviews on the current file
                        (version {manuscriptFileVersionLabel}). Earlier rounds remain in the read-only block
                        above.{" "}
                        <Link
                          to="/revision"
                          className="font-medium underline underline-offset-2 text-violet-900"
                        >
                          Revision cycle
                        </Link>{" "}
                        lists all uploaded versions.
                      </p>
                    )}
                  </div>
                ) : null}
              </header>

              {priorRounds.length > 0 ? (
                <details
                  className="group rounded-xl border border-slate-200 bg-slate-50/90 shadow-sm p-4"
                  open={priorRounds.length <= 2}
                >
                  <summary className="cursor-pointer list-none font-semibold text-slate-900 flex items-center justify-between gap-2">
                    <span>Earlier rounds (read-only)</span>
                    <span className="text-xs font-normal text-slate-600 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                      {priorRounds.length} round{priorRounds.length === 1 ? "" : "s"}
                    </span>
                  </summary>
                  <p className="text-xs text-slate-600 mt-2 mb-4">
                    Full reviewer text and recorded decisions from before the active round. Collapse this
                    block when you need more vertical space (summary stays visible).
                  </p>
                  <div className="space-y-6 pt-2 border-t border-slate-200/80">
                    {priorRounds.map((pr) => (
                      <div
                        key={pr.round}
                        className="rounded-xl border border-white bg-white/90 shadow-sm p-4 md:p-5"
                      >
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          Round {pr.round}
                          <span className="font-normal text-gray-500 ml-2">
                            · {new Date(pr.createdAt).toLocaleDateString()}
                          </span>
                        </h3>
                        <PriorRoundDecisionSummary round={pr} />
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Submitted reviews
                        </h4>
                        <RoundSubmittedReviewsList round={pr} />
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}

              <section
                className="rounded-xl border border-blue-100 bg-white shadow-sm p-5 md:p-6 space-y-6 border-l-4 border-l-blue-600"
                aria-labelledby="active-round-heading"
              >
                <h2 id="active-round-heading" className="text-lg font-semibold text-gray-900">
                  Round {activeRound}{" "}
                  <span className="text-blue-700 font-medium">(active)</span>
                </h2>
                <p className="text-sm text-gray-600 -mt-4">
                  Reviews received: {submittedReviews}/{reviewsRequiredForDecision} (required to save a
                  decision)
                  {dbRoundTargetExceedsPolicy ? (
                    <> · Stored round target in data: {storedRoundTarget}</>
                  ) : null}
                </p>
                {dbRoundTargetExceedsPolicy ? (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    This manuscript still carries round target <strong>{storedRoundTarget}</strong> in merged
                    metadata; you may save a decision after <strong>{reviewsRequiredForDecision}</strong>{" "}
                    submitted reviews. Apply the latest Supabase migration for{" "}
                    <code className="font-mono text-[11px]">target_reviewer_count</code> to align the database.
                  </p>
                ) : null}

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-indigo-950 mb-2">
                  AI-assisted reviewer suggestions (expertise match)
                </h3>
                <p className="text-xs text-indigo-900/80 mb-3">
                  Proposal-aligned ranking by manuscript focus (Land/Air/Water/People). Editors confirm
                  each invite.{" "}
                  {reviewerSource === "database" ? (
                    <span className="font-medium">Directory: registered reviewers (profiles).</span>
                  ) : (
                    <span className="font-medium">Directory: demo fallback (no DB reviewers or RLS blocked).</span>
                  )}
                </p>
                <div className="space-y-2">
                  {!poolReady && (
                    <p className="text-xs text-gray-600">Loading reviewer directory…</p>
                  )}
                  {poolReady &&
                    rankedSuggestions.map((r) => (
                      <div
                        key={r.reviewerEmail}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-indigo-100 bg-white px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{r.reviewerName}</span>
                          <span className="text-gray-600"> · {r.expertise}</span>
                          <span className="ml-2 text-xs text-indigo-600">match {r.matchScore}%</span>
                        </div>
                        <button
                          type="button"
                          disabled={!selected}
                          onClick={() => void handleInviteSuggested(selected, r)}
                          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Invite
                        </button>
                      </div>
                    ))}
                  {poolReady && rankedSuggestions.length === 0 && (
                    <p className="text-xs text-gray-600">All directory reviewers already invited.</p>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!poolReady || !selected}
                    onClick={() => void handleInviteNext(selected)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[2.5rem]"
                  >
                    Invite top suggested reviewer
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/80 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Invitation responses</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Tracks whether each invited reviewer has responded to the invitation (not the same as
                  publication recommendations below).
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="text-gray-700">
                    <span className="font-semibold text-gray-900">{roundData?.invitations.length ?? 0}</span>{" "}
                    invitation{(roundData?.invitations.length ?? 0) === 1 ? "" : "s"} sent
                  </span>
                  <span className="text-gray-400" aria-hidden>
                    ·
                  </span>
                  <span className="text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-0.5">
                    Pending: {invitationCounts.invited}
                  </span>
                  <span className="text-green-800 bg-green-50 border border-green-100 rounded px-2 py-0.5">
                    Accepted: {invitationCounts.accepted}
                  </span>
                  <span className="text-gray-800 bg-white border border-gray-200 rounded px-2 py-0.5">
                    Declined: {invitationCounts.declined}
                  </span>
                  {invitationCounts.expired > 0 ? (
                    <span className="text-gray-700 bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
                      Expired: {invitationCounts.expired}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Reviewer recommendations (this round, submitted only)
                </h3>
                <p className="text-xs text-gray-600 mt-1 mb-3">
                  Counts reflect completed reviews in <strong>Round {activeRound}</strong> only. They update
                  after each full submission—not when a reviewer accepts an invitation.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {recommendationTileOrder.map((key) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 shadow-sm">
                      <p className="text-xs text-gray-600 leading-tight">{recommendationShortLabel(key)}</p>
                      <p className="text-xl font-semibold text-gray-900 mt-1">{recommendationCounts[key]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/40 shadow-sm p-4">
                <h3 className="font-semibold text-gray-900">Submitted reviews (this round)</h3>
                {roundData ? (
                  <RoundSubmittedReviewsList round={roundData} />
                ) : (
                  <p className="text-sm text-gray-500">No round data for this manuscript yet.</p>
                )}
              </div>

              <div className="space-y-2 rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-semibold text-gray-900">Invitations and deadlines</h3>
                {(roundData?.invitations ?? []).map((inv) => {
                  const overdue =
                    inv.status !== "declined" && new Date(inv.dueAt).getTime() < Date.now();
                  return (
                    <div
                      key={inv.id}
                      className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-2 flex-wrap bg-white shadow-sm"
                    >
                      <div>
                        <p className="text-sm text-gray-900">
                          {inv.reviewerName} ({inv.reviewerEmail})
                        </p>
                        <p className={`text-xs ${overdue ? "text-red-700" : "text-gray-600"}`}>
                          Due: {new Date(inv.dueAt).toLocaleDateString()} • Status: {inv.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void sendReviewReminder(selected, inv.id)}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 shrink-0 cursor-pointer"
                      >
                        Send reminder
                      </button>
                    </div>
                  );
                })}
                {(roundData?.invitations.length ?? 0) === 0 && (
                  <p className="text-sm text-gray-500">No invitations yet.</p>
                )}
              </div>

              <div className="space-y-3 rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                <h3 className="font-semibold text-gray-900">Editorial decision</h3>
                <p className="text-xs text-gray-600">
                  One decision is recorded per round for audit. After it is saved, the manuscript status
                  updates and this round&apos;s decision cannot be edited here—use the next workflow stage
                  or a new review round if applicable.
                </p>
                {acceptRejectConflict && !roundDecisionLocked ? (
                  <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Reviewers disagree on <strong>accept</strong> vs <strong>reject</strong>. You may still
                    record a decision, or choose <strong>Request additional reviewer</strong> to open a new
                    round (another {reviewsRequiredForDecision} reviews required for that round).
                  </p>
                ) : null}
                {roundDecisionLocked && roundData?.editorDecision ? (
                  <div className="rounded-lg border border-green-200 bg-green-50/80 p-4 space-y-2 text-sm">
                    <p className="font-medium text-green-950">Decision recorded for this round</p>
                    <p className="text-gray-900">
                      <span className="text-gray-600">Outcome:</span>{" "}
                      {editorDecisionLabel(roundData.editorDecision)}
                    </p>
                    {roundData.editorDecisionNote?.trim() ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                          Rationale
                        </p>
                        <p className="text-gray-800 whitespace-pre-wrap">{roundData.editorDecisionNote}</p>
                      </div>
                    ) : null}
                    {roundData.decidedAt ? (
                      <p className="text-xs text-gray-600">
                        Recorded {new Date(roundData.decidedAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <select
                      value={decision}
                      onChange={(e) => setDecision(e.target.value as typeof decision)}
                      disabled={decisionSubmitting}
                      className="w-full border border-gray-300 rounded px-3 py-2 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <option value="revise">Request revision</option>
                      <option value="accept">Accept manuscript</option>
                      <option value="reject">Reject</option>
                      <option value="additional-reviewer">
                        Request additional reviewer (new round; {reviewsRequiredForDecision} reviews required)
                      </option>
                    </select>
                    <textarea
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                      placeholder="Editorial rationale / consolidated decision note (required)"
                      rows={4}
                      disabled={decisionSubmitting}
                      className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      disabled={!canDecide || !decisionNote.trim() || decisionSubmitting}
                      onClick={() => void handleSaveEditorialDecision()}
                      className="inline-flex items-center justify-center gap-2 min-h-[2.5rem] px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {decisionSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                          Saving…
                        </>
                      ) : (
                        "Save decision"
                      )}
                    </button>
                    {!canDecide && (
                      <p className="text-xs text-amber-700">
                        At least {reviewsRequiredForDecision} submitted reviews are required before you can save
                        a decision.
                      </p>
                    )}
                  </>
                )}
              </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
