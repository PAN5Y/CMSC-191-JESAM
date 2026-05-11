import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import type {
  Manuscript,
  PeerReviewRound,
  ReviewerRecommendation,
  SubmissionMetadata,
} from "@/types";
import { useSubmissions } from "@/modules/submission/hooks/useSubmissions";
import { updateManuscriptRow } from "@/lib/manuscripts-db";
import {
  appendAudit,
  appendNotification,
  PEER_REVIEW_TARGET_COUNT,
  setInvitationStatus,
  submitReview,
} from "@/lib/workflow";
import {
  fetchPeerReviewStatesBatch,
  insertInvitation,
  insertReviewSubmission,
  peerReviewRoundRowExists,
  setManuscriptActiveRound,
  updateInvitationStatus,
  updateRoundEditorDecision,
  upsertPeerReviewRound,
  getRoundRowId,
} from "@/lib/peer-review-db";
import { manuscriptNeedsEditorToStartPostRevisionRound } from "@/modules/revision/hooks/useRevision";
import {
  pickNextSuggestedReviewer,
  REVIEWER_CANDIDATE_POOL,
} from "@/lib/reviewer-suggestions";

function invitationIdIsUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

function mergeSubmissionMeta(
  manuscript: Manuscript,
  patch: Record<string, unknown>,
  dropPeerReviewJson: boolean,
): SubmissionMetadata {
  const prev = manuscript.submission_metadata ?? {};
  const next = { ...prev, ...patch } as SubmissionMetadata;
  if (dropPeerReviewJson) {
    delete (next as Record<string, unknown>).peer_review;
  }
  return next;
}

async function manuscriptHasPeerReviewRounds(
  manuscriptId: string,
): Promise<boolean> {
  const map = await fetchPeerReviewStatesBatch([manuscriptId]);
  const st = map.get(manuscriptId);
  return Boolean(st && st.rounds.length > 0);
}

function activeRoundNumber(m: Manuscript): number {
  return (
    m.peer_review_active_round ??
    m.submission_metadata?.peer_review?.activeRound ??
    1
  );
}

export function usePeerReview() {
  const { manuscripts, fetchManuscripts } = useSubmissions();

  useEffect(() => {
    void fetchManuscripts();
  }, [fetchManuscripts]);

  const peerReviewManuscripts = manuscripts.filter(
    (m) =>
      m.status === "Peer Review" ||
      m.status === "Peer Review in Progress" ||
      m.status === "Review Conducted" ||
      m.status === "Editorial Review" ||
      m.status === "Revision Requested",
  );

  const save = useCallback(
    async (id: string, updates: Record<string, unknown>) => {
      const { error } = await updateManuscriptRow(id, updates);
      if (error) {
        toast.error(error.message);
        return false;
      }
      await fetchManuscripts();
      return true;
    },
    [fetchManuscripts],
  );

  const initializeRound = useCallback(
    async (manuscript: Manuscript) => {
      const roundNum = activeRoundNumber(manuscript);
      const { error: upErr } = await upsertPeerReviewRound(
        manuscript.id,
        roundNum,
        PEER_REVIEW_TARGET_COUNT,
      );
      if (upErr) {
        toast.error(upErr.message);
        return false;
      }
      const { error: arErr } = await setManuscriptActiveRound(
        manuscript.id,
        roundNum,
      );
      if (arErr) {
        toast.error(arErr.message);
        return false;
      }

      const nextMeta = mergeSubmissionMeta(
        manuscript,
        {
          audit_logs: appendAudit(
            manuscript,
            "editor",
            "peer-review-round-initialized",
          ),
        },
        true,
      );

      return save(manuscript.id, {
        submission_metadata: nextMeta as unknown as Record<string, unknown>,
      });
    },
    [save],
  );

  const addInvitation = useCallback(
    async (
      manuscript: Manuscript,
      reviewer: {
        reviewerEmail: string;
        reviewerName: string;
        expertise: string;
      },
    ) => {
      const roundNum = activeRoundNumber(manuscript);
      const { error: upErr } = await upsertPeerReviewRound(
        manuscript.id,
        roundNum,
        PEER_REVIEW_TARGET_COUNT,
      );
      if (upErr) {
        toast.error(upErr.message);
        return false;
      }
      const roundId = await getRoundRowId(manuscript.id, roundNum);
      if (!roundId) {
        toast.error("Peer review round not found after upsert.");
        return false;
      }

      const { error: invErr } = await insertInvitation(roundId, {
        reviewerEmail: reviewer.reviewerEmail,
        reviewerName: reviewer.reviewerName,
        expertise: reviewer.expertise,
        dueDays: 14, // 3 days to confirm + 11 days to review (JESAM Week 4–10)
      });
      if (invErr) {
        toast.error(invErr.message);
        return false;
      }

      const nextMeta = mergeSubmissionMeta(
        manuscript,
        {
          notifications: appendNotification(manuscript, {
            type: "review-invitation",
            recipientRole: "reviewer",
            recipientEmail: reviewer.reviewerEmail,
            message: `You were invited to review manuscript ${manuscript.reference_code ?? manuscript.id}.`,
          }),
          audit_logs: appendAudit(
            manuscript,
            "editor",
            "reviewer-invited",
            `${reviewer.reviewerEmail} (${reviewer.expertise})`,
          ),
        },
        true,
      );

      return save(manuscript.id, {
        submission_metadata: nextMeta as unknown as Record<string, unknown>,
      });
    },
    [save],
  );

  const respondInvitation = useCallback(
    async (
      manuscript: Manuscript,
      invitationId: string,
      status: "accepted" | "declined",
    ) => {
      const isInPeerReview = manuscript.status === "Peer Review";
      const nextStatus =
        status === "accepted" && isInPeerReview
          ? "Peer Review in Progress"
          : undefined;

      let ok = false;
      if (invitationIdIsUuid(invitationId)) {
        const { error } = await updateInvitationStatus(invitationId, status);
        if (error) {
          toast.error(error.message);
          return false;
        }
        const nextMeta = mergeSubmissionMeta(
          manuscript,
          {
            audit_logs: appendAudit(
              manuscript,
              "reviewer",
              `invitation-${status}`,
            ),
          },
          true,
        );
        const updates: Record<string, unknown> = {
          submission_metadata: nextMeta as unknown as Record<string, unknown>,
        };
        if (nextStatus) updates.status = nextStatus;
        ok = await save(manuscript.id, updates);
      } else {
        const peerReview = setInvitationStatus(
          manuscript,
          invitationId,
          status,
        );
        if (!peerReview) return false;
        const nextMeta = mergeSubmissionMeta(
          manuscript,
          {
            peer_review: peerReview,
            audit_logs: appendAudit(
              manuscript,
              "reviewer",
              `invitation-${status}`,
            ),
          },
          false,
        );
        const updates: Record<string, unknown> = {
          submission_metadata: nextMeta as unknown as Record<string, unknown>,
        };
        if (nextStatus) updates.status = nextStatus;
        ok = await save(manuscript.id, updates);
      }

      return ok;
    },
    [save],
  );

  const submitReviewerFeedback = useCallback(
    async (
      manuscript: Manuscript,
      input: {
        invitationId: string;
        reviewerEmail: string;
        summary: string;
        majorConcerns: string;
        minorConcerns: string;
        confidentialToEditor?: string;
        recommendation: ReviewerRecommendation;
      },
    ) => {
      const ar = activeRoundNumber(manuscript);
      const roundData =
        manuscript.submission_metadata?.peer_review?.rounds.find(
          (r) => r.round === ar,
        );
      const currentSubmissions = roundData?.submissions.length ?? 0;
      const reachedTarget = currentSubmissions + 1 >= PEER_REVIEW_TARGET_COUNT;
      const inReview =
        manuscript.status === "Peer Review" ||
        manuscript.status === "Peer Review in Progress";
      const reviewConductedStatus =
        reachedTarget && inReview ? "Review Conducted" : undefined;

      if (invitationIdIsUuid(input.invitationId)) {
        const { error } = await insertReviewSubmission(input.invitationId, {
          reviewerEmail: input.reviewerEmail,
          summary: input.summary,
          majorConcerns: input.majorConcerns,
          minorConcerns: input.minorConcerns,
          confidentialToEditor: input.confidentialToEditor,
          recommendation: input.recommendation,
        });
        if (error) {
          toast.error(error.message);
          return false;
        }
        const nextMeta = mergeSubmissionMeta(
          manuscript,
          {
            notifications: appendNotification(manuscript, {
              type: "review-submitted",
              recipientRole: "technical_editor",
              message: `A review was submitted for ${manuscript.reference_code ?? manuscript.id}.`,
            }),
            audit_logs: appendAudit(
              manuscript,
              "reviewer",
              "review-submitted",
              input.recommendation,
            ),
          },
          true,
        );
        const updates: Record<string, unknown> = {
          submission_metadata: nextMeta as unknown as Record<string, unknown>,
        };
        if (reviewConductedStatus) updates.status = reviewConductedStatus;
        return save(manuscript.id, updates);
      }

      const peerReview = submitReview(manuscript, input);
      if (!peerReview) return false;
      const nextMeta = mergeSubmissionMeta(
        manuscript,
        {
          peer_review: peerReview,
          notifications: appendNotification(manuscript, {
            type: "review-submitted",
            recipientRole: "technical_editor",
            message: `A review was submitted for ${manuscript.reference_code ?? manuscript.id}.`,
          }),
          audit_logs: appendAudit(
            manuscript,
            "reviewer",
            "review-submitted",
            input.recommendation,
          ),
        },
        false,
      );
      const updates: Record<string, unknown> = {
        submission_metadata: nextMeta as unknown as Record<string, unknown>,
      };
      if (reviewConductedStatus) updates.status = reviewConductedStatus;
      return save(manuscript.id, updates);
    },
    [save],
  );

  const makeEditorialDecision = useCallback(
    async (
      manuscript: Manuscript,
      decision: "minor-revision" | "major-revision" | "reject",
      note: string,
    ) => {
      const active = activeRoundNumber(manuscript);
      const relational = await manuscriptHasPeerReviewRounds(manuscript.id);
      const ref = manuscript.reference_code ?? manuscript.id;

      const nextStatus =
        decision === "minor-revision"
          ? "Editorial Review"
          : decision === "major-revision"
            ? "Revision Requested"
            : "Rejected";

      // Collect accepted reviewers from current round for major-revision notifications
      const currentRound =
        manuscript.submission_metadata?.peer_review?.rounds.find(
          (r) => r.round === active,
        );
      const acceptedReviewers =
        decision === "major-revision"
          ? (currentRound?.invitations.filter((i) => i.status === "accepted") ??
            [])
          : [];

      // Author notification (always)
      const notifsWithAuthor = appendNotification(manuscript, {
        type: "screening-decision",
        recipientRole: "author",
        message:
          decision === "major-revision"
            ? `Major revisions required for ${ref}. Please address reviewer comments and resubmit.`
            : `Editorial decision: ${decision} for ${ref}.`,
      });

      // Per-reviewer notifications for major-revision (you'll be notified when author resubmits)
      const reviewerNotifs = acceptedReviewers.map((inv) => ({
        id: `notif-${Math.random().toString(36).slice(2, 10)}`,
        type: "review-invitation" as const,
        recipientRole: "reviewer" as const,
        recipientEmail: inv.reviewerEmail,
        message: `Major revisions have been requested for ${ref}. You will be notified when the author submits the revised manuscript.`,
        createdAt: new Date().toISOString(),
        delivered: true,
      }));

      const allNotifs = [...notifsWithAuthor, ...reviewerNotifs];

      // For major-revision: open a revision cycle window directly (no sendToAuthor step)
      const revisionCyclePatch =
        decision === "major-revision"
          ? {
              revision_cycle: {
                rounds:
                  manuscript.submission_metadata?.revision_cycle?.rounds ?? [],
                extensionPolicyDays: 14,
              },
            }
          : {};

      if (relational) {
        const { error: decErr } = await updateRoundEditorDecision(
          manuscript.id,
          active,
          decision,
          note,
        );
        if (decErr) {
          toast.error(decErr.message);
          return false;
        }

        const nextMeta = mergeSubmissionMeta(
          manuscript,
          {
            ...revisionCyclePatch,
            notifications: allNotifs,
            audit_logs: appendAudit(
              manuscript,
              "editor",
              "peer-review-decision",
              `${decision}: ${note}`,
            ),
          },
          true,
        );

        return save(manuscript.id, {
          status: nextStatus,
          submission_metadata: nextMeta as unknown as Record<string, unknown>,
        });
      }

      const peerReview = manuscript.submission_metadata?.peer_review;
      const nextPeer = peerReview
        ? {
            ...peerReview,
            rounds: peerReview.rounds.map((round) =>
              round.round === active
                ? {
                    ...round,
                    editorDecision: decision,
                    editorDecisionNote: note,
                    decidedAt: new Date().toISOString(),
                  }
                : round,
            ),
          }
        : peerReview;

      const nextMeta = mergeSubmissionMeta(
        manuscript,
        {
          peer_review: nextPeer,
          ...revisionCyclePatch,
          notifications: allNotifs,
          audit_logs: appendAudit(
            manuscript,
            "editor",
            "peer-review-decision",
            `${decision}: ${note}`,
          ),
        },
        false,
      );

      return save(manuscript.id, {
        status: nextStatus,
        submission_metadata: nextMeta as unknown as Record<string, unknown>,
      });
    },
    [save],
  );

  const startPostRevisionPeerReviewRound = useCallback(
    async (manuscript: Manuscript) => {
      if (!manuscriptNeedsEditorToStartPostRevisionRound(manuscript)) {
        toast.error(
          "Cannot open a post-revision round for this manuscript in its current state.",
        );
        return false;
      }
      const active = activeRoundNumber(manuscript);
      const nextRound = active + 1;
      const relational = await manuscriptHasPeerReviewRounds(manuscript.id);

      if (relational) {
        const exists = await peerReviewRoundRowExists(manuscript.id, nextRound);
        if (exists) {
          toast.message("Post-revision round already exists.");
          await fetchManuscripts();
          return true;
        }
        const { error: arErr } = await setManuscriptActiveRound(
          manuscript.id,
          nextRound,
        );
        if (arErr) {
          toast.error(arErr.message);
          return false;
        }
        const { error: roundErr } = await upsertPeerReviewRound(
          manuscript.id,
          nextRound,
          PEER_REVIEW_TARGET_COUNT,
        );
        if (roundErr) {
          toast.error(roundErr.message);
          return false;
        }
      } else {
        const peerReview = manuscript.submission_metadata?.peer_review;
        if (!peerReview) {
          toast.error("Peer review metadata is missing.");
          return false;
        }
        if (peerReview.rounds.some((r) => r.round === nextRound)) {
          toast.error("Next peer-review round already exists in metadata.");
          return false;
        }
        const newR: PeerReviewRound = {
          round: nextRound,
          createdAt: new Date().toISOString(),
          targetReviewerCount: PEER_REVIEW_TARGET_COUNT,
          invitations: [],
          submissions: [],
        };
        const nextPeer = {
          ...peerReview,
          activeRound: nextRound,
          rounds: [...peerReview.rounds, newR],
        };
        const { error: colErr } = await setManuscriptActiveRound(
          manuscript.id,
          nextRound,
        );
        if (colErr) {
          toast.error(colErr.message);
          return false;
        }
        const nextMeta = mergeSubmissionMeta(
          manuscript,
          {
            peer_review: nextPeer,
            audit_logs: appendAudit(
              manuscript,
              "editor",
              "post-revision-peer-review-round-opened",
              `Opened round ${nextRound} after author revision`,
            ),
          },
          false,
        );
        return save(manuscript.id, {
          submission_metadata: nextMeta as unknown as Record<string, unknown>,
        });
      }

      const nextMeta = mergeSubmissionMeta(
        manuscript,
        {
          audit_logs: appendAudit(
            manuscript,
            "editor",
            "post-revision-peer-review-round-opened",
            `Opened round ${nextRound} after author revision`,
          ),
        },
        true,
      );
      return save(manuscript.id, {
        submission_metadata: nextMeta as unknown as Record<string, unknown>,
      });
    },
    [save, fetchManuscripts],
  );

  /**
   * Completes the 1-week editorial review stage.
   * Moves manuscript from 'Editorial Review' → 'Accepted' and appends author notification.
   */
  const completeEditorialReview = useCallback(
    async (manuscript: Manuscript, editorNote: string) => {
      if (manuscript.status !== "Editorial Review") {
        toast.error("Manuscript is not in the Editorial Review stage.");
        return false;
      }
      const nextMeta = mergeSubmissionMeta(
        manuscript,
        {
          notifications: appendNotification(manuscript, {
            type: "accepted",
            recipientRole: "author",
            message: `Your manuscript ${
              manuscript.reference_code ?? manuscript.id
            } has been accepted for publication after editorial review.`,
          }),
          audit_logs: appendAudit(
            manuscript,
            "editor",
            "editorial-review-completed",
            editorNote,
          ),
        },
        true,
      );
      return save(manuscript.id, {
        status: "Accepted",
        submission_metadata: nextMeta as unknown as Record<string, unknown>,
      });
    },
    [save],
  );

  const sendReviewReminder = useCallback(
    async (manuscript: Manuscript, invitationId: string) => {
      const relational = await manuscriptHasPeerReviewRounds(manuscript.id);
      const peerReview = manuscript.submission_metadata?.peer_review;
      if (!peerReview) return false;
      const invitation = peerReview.rounds
        .flatMap((r) => r.invitations)
        .find((inv) => inv.id === invitationId);
      if (!invitation) return false;

      const nextMeta = mergeSubmissionMeta(
        manuscript,
        {
          notifications: appendNotification(manuscript, {
            type: "review-invitation",
            recipientRole: "reviewer",
            recipientEmail: invitation.reviewerEmail,
            message: `Reminder: review due on ${new Date(invitation.dueAt).toLocaleDateString()} for ${
              manuscript.reference_code ?? manuscript.id
            }.`,
          }),
          audit_logs: appendAudit(
            manuscript,
            "editor",
            "review-reminder-sent",
            invitation.reviewerEmail,
          ),
        },
        relational,
      );
      return save(manuscript.id, {
        submission_metadata: nextMeta as unknown as Record<string, unknown>,
      });
    },
    [save],
  );

  return {
    manuscripts: peerReviewManuscripts,
    fetchManuscripts,
    initializeRound,
    addInvitation,
    respondInvitation,
    submitReviewerFeedback,
    makeEditorialDecision,
    completeEditorialReview,
    startPostRevisionPeerReviewRound,
    sendReviewReminder,
  };
}
