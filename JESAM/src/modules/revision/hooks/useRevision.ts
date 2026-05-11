import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type {
  AutomatedCheckSnapshot,
  Manuscript,
  ManuscriptStatus,
} from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmissions } from "@/modules/submission/hooks/useSubmissions";
import {
  updateManuscriptRow,
  uploadRevisionFileToStorage,
} from "@/lib/manuscripts-db";
import { manuscriptHasPeerReviewRoundsInDb } from "@/lib/peer-review-db";
import {
  getNextRevisionNumber,
  insertManuscriptRevisionVersion,
  insertRevisionExtensionGrant,
} from "@/lib/revision-db";
import { appendAudit, appendNotification } from "@/lib/workflow";

function metadataPatch(manuscript: Manuscript, patch: Record<string, unknown>) {
  const prev = manuscript.submission_metadata ?? {};
  return { ...prev, ...patch };
}

/** Editor must complete internal review before notifying the author (1-week editorial review stage). */
export function manuscriptNeedsEditorialReview(m: Manuscript): boolean {
  return m.status === "Editorial Review";
}

/** TE has a 1-week final check before accepting or returning to author. */
export function manuscriptNeedsCheckingDecision(m: Manuscript): boolean {
  return m.status === "Checking";
}

/** Manuscript is waiting on an author upload (revision queue). */
export function manuscriptNeedsRevisionAction(m: Manuscript): boolean {
  return (
    m.status === "Revision Requested" ||
    m.status === "Returned to Author" ||
    m.status === "For Format Revision" ||
    m.status === "Return to Revision"
  );
}

/** At least one author revision file was recorded (relational or merged legacy rounds). */
export function manuscriptHasRevisionUploads(m: Manuscript): boolean {
  return (m.submission_metadata?.revision_cycle?.rounds?.length ?? 0) > 0;
}

function isInPeerReviewPhase(m: Manuscript): boolean {
  return (
    m.status === "Peer Review" ||
    m.status === "Peer Review in Progress" ||
    m.status === "Review Conducted"
  );
}

/**
 * Manuscript is back in peer review after at least one author revision upload.
 * Canonical lifecycle: Revision cycle → return to Peer Review → editorial staff coordinate reviewers → editorial decision (proposal / transcript).
 */
export function manuscriptAwaitingEditorialReReviewAfterRevision(
  m: Manuscript,
): boolean {
  return isInPeerReviewPhase(m) && manuscriptHasRevisionUploads(m);
}

/**
 * Editor must explicitly open the next peer-review round (proposal §2.5): active round still shows
 * a terminal decision, author revision exists, and the successor round row is not present yet.
 */
export function manuscriptNeedsEditorToStartPostRevisionRound(
  m: Manuscript,
): boolean {
  if (!isInPeerReviewPhase(m)) return false;
  if (!manuscriptHasRevisionUploads(m)) return false;
  const pr = m.submission_metadata?.peer_review;
  if (!pr?.rounds?.length) return false;
  const active = m.peer_review_active_round ?? pr.activeRound ?? 1;
  const currentRound = pr.rounds.find((r) => r.round === active);
  const decision = currentRound?.editorDecision;
  const hasTerminalDecision =
    decision === "minor-revision" ||
    decision === "major-revision" ||
    decision === "reject";
  if (!hasTerminalDecision) return false;
  const hasNextRound = pr.rounds.some((r) => r.round === active + 1);
  return !hasNextRound;
}

/** Merged peer-review JSON (after list fetch) shows any invitations, reviews, or decisions. */
export function manuscriptHasPeerReviewActivity(m: Manuscript): boolean {
  const rounds = m.submission_metadata?.peer_review?.rounds ?? [];
  return rounds.some(
    (r) =>
      r.invitations.length > 0 ||
      r.submissions.length > 0 ||
      r.editorDecision != null ||
      (r.editorDecisionNote != null && r.editorDecisionNote.trim() !== ""),
  );
}

/** Author was returned before external peer review; resubmit goes to format verification, not reviewers. */
export function intakeReturnedAuthorResubmitGoesToFormatQueue(
  m: Manuscript,
): boolean {
  if (m.status !== "Returned to Author") return false;
  return !manuscriptHasPeerReviewActivity(m);
}

const TERMINAL_STATUSES = new Set<string>([
  "In Production",
  "Published",
  "Accepted",
  "Retracted",
]);

export function useRevision() {
  const { user } = useAuth();
  const { manuscripts, fetchManuscripts } = useSubmissions();

  useEffect(() => {
    void fetchManuscripts();
  }, [fetchManuscripts]);

  const revisionManuscripts = useMemo(() => {
    const byId = new Map<string, Manuscript>();
    for (const m of manuscripts) {
      if (TERMINAL_STATUSES.has(m.status)) continue;
      if (
        manuscriptNeedsEditorialReview(m) ||
        manuscriptNeedsCheckingDecision(m) ||
        manuscriptNeedsRevisionAction(m) ||
        manuscriptHasRevisionUploads(m)
      ) {
        byId.set(m.id, m);
      }
    }
    const merged = Array.from(byId.values());
    merged.sort((a, b) => {
      const aEditorial = manuscriptNeedsEditorialReview(a);
      const bEditorial = manuscriptNeedsEditorialReview(b);
      if (aEditorial !== bEditorial) return aEditorial ? -1 : 1;
      const aChecking = manuscriptNeedsCheckingDecision(a);
      const bChecking = manuscriptNeedsCheckingDecision(b);
      if (aChecking !== bChecking) return aChecking ? -1 : 1;
      const aActive = manuscriptNeedsRevisionAction(a);
      const bActive = manuscriptNeedsRevisionAction(b);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return 0;
    });
    return merged;
  }, [manuscripts]);

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

  const submitRevision = useCallback(
    async (
      manuscript: Manuscript,
      payload: {
        authorNote: string;
        responseLetter?: string;
        file: File;
        automatedChecks?: AutomatedCheckSnapshot;
        similarityScore?: number;
      },
    ) => {
      const uid = user?.id;
      if (!uid) {
        toast.error("You must be signed in to submit a revision.");
        return false;
      }
      if (!payload.file?.size) {
        toast.error("Please upload a revised manuscript file.");
        return false;
      }
      const isProductionFormatRevision =
        manuscript.status === "For Format Revision";
      const ac = payload.automatedChecks;
      if (!isProductionFormatRevision) {
        if (
          !ac ||
          ac.formatting.status !== "passed" ||
          ac.assets.status !== "passed" ||
          ac.plagiarism.status !== "passed"
        ) {
          toast.error(
            "Automated checks must all pass before submitting a revision.",
          );
          return false;
        }
      }

      const revisionNumber = await getNextRevisionNumber(manuscript.id);
      const { publicUrl, error: uploadError } =
        await uploadRevisionFileToStorage(
          manuscript.id,
          revisionNumber,
          payload.file,
        );
      if (uploadError || !publicUrl) {
        toast.error(uploadError?.message ?? "Could not upload revision file.");
        return false;
      }

      const { error: insertError } = await insertManuscriptRevisionVersion(
        manuscript.id,
        {
          fileUrl: publicUrl,
          authorNote: payload.authorNote,
          responseLetter: payload.responseLetter,
          submitterId: uid,
        },
      );
      if (insertError) {
        toast.error(insertError.message);
        return false;
      }

      let nextStatus: ManuscriptStatus = "Peer Review";
      if (isProductionFormatRevision) {
        nextStatus = "Production Checks";
      } else if (manuscript.status === "Returned to Author") {
        const hasPeerRounds = await manuscriptHasPeerReviewRoundsInDb(
          manuscript.id,
        );
        if (!hasPeerRounds) nextStatus = "Pending Format Verification";
      } else {
        // Minor-revision path: skip peer review, go directly to TE checking
        const rounds =
          manuscript.submission_metadata?.peer_review?.rounds ?? [];
        const lastRound = [...rounds]
          .sort((a, b) => b.round - a.round)
          .find((r) => r.editorDecision != null);
        if (lastRound?.editorDecision === "minor-revision") {
          nextStatus = "Checking";
        }
      }

      const ref = manuscript.reference_code ?? manuscript.id;
      const notifMessage =
        nextStatus === "Pending Format Verification"
          ? `Revised file submitted for ${ref}; queued for handling-editor format verification.`
          : nextStatus === "Production Checks"
            ? `Format revision submitted for ${ref}; queued for production checks.`
            : `Revision submitted for ${ref}.`;

      // Detect major-revision resubmission to notify original reviewers
      const rounds = manuscript.submission_metadata?.peer_review?.rounds ?? [];
      const lastRound = [...rounds].sort((a, b) => b.round - a.round)[0];
      const isMajorRevision = lastRound?.editorDecision === "major-revision";
      const reviewerNotifs = isMajorRevision
        ? (
            lastRound?.invitations.filter((i) => i.status === "accepted") ?? []
          ).map((inv) => ({
            id: `notif-${Math.random().toString(36).slice(2, 10)}`,
            type: "revision-submitted" as const,
            recipientRole: "reviewer" as const,
            recipientEmail: inv.reviewerEmail,
            message: `The author has submitted a revised manuscript for ${ref}. A new peer review round will begin shortly.`,
            createdAt: new Date().toISOString(),
            delivered: true,
          }))
        : [];

      const baseNotifs = appendNotification(manuscript, {
        type: "revision-submitted",
        recipientRole: "associate_editor",
        message: notifMessage,
      });

      const prev = manuscript.submission_metadata ?? {};
      const nextMeta = metadataPatch(manuscript, {
        revision_cycle: prev.revision_cycle
          ? {
              extensionPolicyDays: prev.revision_cycle.extensionPolicyDays,
              rounds: [],
            }
          : undefined,
        automated_checks: isProductionFormatRevision
          ? undefined
          : payload.automatedChecks,
        similarity_score: isProductionFormatRevision
          ? undefined
          : payload.similarityScore,
        notifications: appendNotification(manuscript, {
          type: "revision-submitted",
          recipientRole: isProductionFormatRevision
            ? "production_editor"
            : "technical_editor",
          message: notifMessage,
        }),
        audit_logs: appendAudit(
          manuscript,
          "author",
          nextStatus === "Pending Format Verification"
            ? "intake-revision-submitted"
            : nextStatus === "Production Checks"
              ? "format-revision-submitted"
              : "revision-submitted",
          payload.authorNote,
        ),
      });
      delete nextMeta.template_check_report;
      if (isProductionFormatRevision) {
        delete nextMeta.automated_checks;
        delete nextMeta.similarity_score;
        delete nextMeta.production_check_summary;
      }
      const ok = await save(manuscript.id, {
        status: nextStatus,
        file_url: publicUrl,
        submission_metadata: nextMeta,
      });
      if (ok)
        toast.success(
          `Revised manuscript submitted for ${manuscript.reference_code ?? manuscript.id}.`,
        );
      return ok;
    },
    [save, user?.id],
  );

  const sendToAuthor = useCallback(
    async (
      manuscript: Manuscript,
      review: { summary: string; majorConcerns: string; minorConcerns: string },
    ) => {
      if (manuscript.status !== "Editorial Review") {
        toast.error("Manuscript is not in Editorial Review.");
        return false;
      }
      const ref = manuscript.reference_code ?? manuscript.id;
      const prev = manuscript.submission_metadata ?? {};

      // Minor revision → 1-week checking window; other cases → 2 weeks
      const rounds = prev.peer_review?.rounds ?? [];
      const lastRound = [...rounds].sort((a, b) => b.round - a.round)[0];
      const extensionPolicyDays =
        lastRound?.editorDecision === "minor-revision" ? 7 : 14;

      const nextMeta = metadataPatch(manuscript, {
        editorial_review: {
          summary: review.summary,
          majorConcerns: review.majorConcerns,
          minorConcerns: review.minorConcerns,
          reviewedAt: new Date().toISOString(),
          reviewedBy: user?.id,
        },
        revision_cycle: {
          rounds: prev.revision_cycle?.rounds ?? [],
          extensionPolicyDays,
        },
        notifications: appendNotification(manuscript, {
          type: "revision-requested",
          recipientRole: "author",
          message: `Your manuscript ${ref} has been reviewed editorially and requires revision. You have ${extensionPolicyDays === 7 ? "1 week" : "2 weeks"} to submit.`,
        }),
        audit_logs: appendAudit(
          manuscript,
          "editor",
          "revision-sent-to-author",
          "Editorial review complete; author notified for revision.",
        ),
      });
      const ok = await save(manuscript.id, {
        status: "Revision Requested" as ManuscriptStatus,
        submission_metadata: nextMeta,
      });
      if (ok)
        toast.success(
          `Editorial review submitted and sent to the author of ${ref}.`,
        );
      return ok;
    },
    [save, user?.id],
  );

  const submitCheckingDecision = useCallback(
    async (
      manuscript: Manuscript,
      decision: "approve" | "send-back",
      review: { summary: string; majorConcerns: string; minorConcerns: string },
    ) => {
      if (manuscript.status !== "Checking") {
        toast.error("Manuscript is not in Checking status.");
        return false;
      }
      const ref = manuscript.reference_code ?? manuscript.id;
      const nextStatus: ManuscriptStatus =
        decision === "approve" ? "In Layout" : "Revision Requested";
      const nextMeta = metadataPatch(manuscript, {
        checking_review: {
          summary: review.summary,
          majorConcerns: review.majorConcerns,
          minorConcerns: review.minorConcerns,
          reviewedAt: new Date().toISOString(),
          reviewedBy: user?.id,
          decision,
        },
        ...(decision === "send-back"
          ? {
              revision_cycle: {
                rounds:
                  manuscript.submission_metadata?.revision_cycle?.rounds ?? [],
                extensionPolicyDays: 7,
              },
            }
          : {}),
        notifications: appendNotification(manuscript, {
          type: decision === "approve" ? "accepted" : "revision-requested",
          recipientRole: "author",
          message:
            decision === "approve"
              ? `Your manuscript ${ref} has been accepted for layout and proofreading.`
              : `Your manuscript ${ref} requires additional minor revisions. You have 1 week to submit.`,
        }),
        audit_logs: appendAudit(
          manuscript,
          "editor",
          decision === "approve" ? "checking-approved" : "checking-sent-back",
          decision === "approve"
            ? "Manuscript approved for layout and proofreading."
            : "Manuscript returned to author for additional minor revisions.",
        ),
      });
      const ok = await save(manuscript.id, {
        status: nextStatus,
        submission_metadata: nextMeta,
      });
      if (ok)
        toast.success(
          decision === "approve"
            ? `${ref} approved and sent for layout & proofreading.`
            : `${ref} returned to the author for minor revisions.`,
        );
      return ok;
    },
    [save, user?.id],
  );

  const grantExtension = useCallback(
    async (manuscript: Manuscript, reason: string) => {
      const { error: insertError } = await insertRevisionExtensionGrant(
        manuscript.id,
        reason,
      );
      if (insertError) {
        toast.error(insertError.message);
        return false;
      }
      const nextMeta = metadataPatch(manuscript, {
        audit_logs: appendAudit(
          manuscript,
          "editor",
          "revision-extension-granted",
          reason,
        ),
      });
      const ok = await save(manuscript.id, { submission_metadata: nextMeta });
      if (ok)
        toast.success(
          `Extension granted for ${manuscript.reference_code ?? manuscript.id}.`,
        );
      return ok;
    },
    [save],
  );

  return {
    manuscripts: revisionManuscripts,
    fetchManuscripts,
    submitRevision,
    sendToAuthor,
    submitCheckingDecision,
    grantExtension,
  };
}
