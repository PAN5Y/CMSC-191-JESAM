import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { AutomatedCheckSnapshot, Manuscript, ManuscriptStatus } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmissions } from "@/modules/submission/hooks/useSubmissions";
import { updateManuscriptRow, uploadRevisionFileToStorage } from "@/lib/manuscripts-db";
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

/** Manuscript is waiting on an author upload (revision queue). */
export function manuscriptNeedsRevisionAction(m: Manuscript): boolean {
  return (
    m.status === "Revision Requested" ||
    m.status === "Returned to Author" ||
    m.status === "Return to Revision"
  );
}

/** At least one author revision file was recorded (relational or merged legacy rounds). */
export function manuscriptHasRevisionUploads(m: Manuscript): boolean {
  return (m.submission_metadata?.revision_cycle?.rounds?.length ?? 0) > 0;
}

/**
 * Manuscript is back in peer review after at least one author revision upload.
 * Canonical lifecycle: Revision cycle → return to Peer Review → editorial staff coordinate reviewers → editorial decision (proposal / transcript).
 */
export function manuscriptAwaitingEditorialReReviewAfterRevision(m: Manuscript): boolean {
  return m.status === "Peer Review" && manuscriptHasRevisionUploads(m);
}

/**
 * Editor must explicitly open the next peer-review round (proposal §2.5): active round still shows
 * a "revise" decision, author revision exists, and the successor round row is not present yet.
 */
export function manuscriptNeedsEditorToStartPostRevisionRound(m: Manuscript): boolean {
  if (m.status !== "Peer Review") return false;
  if (!manuscriptHasRevisionUploads(m)) return false;
  const pr = m.submission_metadata?.peer_review;
  if (!pr?.rounds?.length) return false;
  const active = m.peer_review_active_round ?? pr.activeRound ?? 1;
  const currentRound = pr.rounds.find((r) => r.round === active);
  const decision = currentRound?.editorDecision;
  const hasTerminalDecision = decision === "accept" || decision === "revise" || decision === "reject";
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
      (r.editorDecisionNote != null && r.editorDecisionNote.trim() !== "")
  );
}

/** Author was returned before external peer review; resubmit goes to format verification, not reviewers. */
export function intakeReturnedAuthorResubmitGoesToFormatQueue(m: Manuscript): boolean {
  if (m.status !== "Returned to Author") return false;
  return !manuscriptHasPeerReviewActivity(m);
}

export function useRevision() {
  const { user } = useAuth();
  const { manuscripts, fetchManuscripts } = useSubmissions();

  useEffect(() => {
    void fetchManuscripts();
  }, [fetchManuscripts]);

  /** Active revision queue plus any item with version history (e.g. back in Peer Review after submit). */
  const revisionManuscripts = useMemo(() => {
    const byId = new Map<string, Manuscript>();
    for (const m of manuscripts) {
      if (manuscriptNeedsRevisionAction(m) || manuscriptHasRevisionUploads(m)) {
        byId.set(m.id, m);
      }
    }
    const merged = Array.from(byId.values());
    merged.sort((a, b) => {
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
    [fetchManuscripts]
  );

  const submitRevision = useCallback(
    async (
      manuscript: Manuscript,
      payload: {
        authorNote: string;
        responseLetter?: string;
        file: File;
        automatedChecks: AutomatedCheckSnapshot;
        similarityScore: number;
      }
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
      const ac = payload.automatedChecks;
      if (
        !ac ||
        ac.formatting.status !== "passed" ||
        ac.assets.status !== "passed" ||
        ac.plagiarism.status !== "passed"
      ) {
        toast.error("Automated checks must all pass before submitting a revision.");
        return false;
      }

      const revisionNumber = await getNextRevisionNumber(manuscript.id);
      const { publicUrl, error: uploadError } = await uploadRevisionFileToStorage(
        manuscript.id,
        revisionNumber,
        payload.file
      );
      if (uploadError || !publicUrl) {
        toast.error(uploadError?.message ?? "Could not upload revision file.");
        return false;
      }

      const { error: insertError } = await insertManuscriptRevisionVersion(manuscript.id, {
        fileUrl: publicUrl,
        authorNote: payload.authorNote,
        responseLetter: payload.responseLetter,
        submitterId: uid,
      });
      if (insertError) {
        toast.error(insertError.message);
        return false;
      }

      let nextStatus: ManuscriptStatus = "Peer Review";
      if (manuscript.status === "Returned to Author") {
        const hasPeerRounds = await manuscriptHasPeerReviewRoundsInDb(manuscript.id);
        if (!hasPeerRounds) nextStatus = "Pending Format Verification";
      }

      const ref = manuscript.reference_code ?? manuscript.id;
      const notifMessage =
        nextStatus === "Pending Format Verification"
          ? `Revised file submitted for ${ref}; queued for handling-editor format verification.`
          : `Revision submitted for ${ref}.`;

      const prev = manuscript.submission_metadata ?? {};
      const nextMeta = metadataPatch(manuscript, {
        revision_cycle: prev.revision_cycle
          ? {
              extensionPolicyDays: prev.revision_cycle.extensionPolicyDays,
              rounds: [],
            }
          : undefined,
        automated_checks: payload.automatedChecks,
        similarity_score: payload.similarityScore,
        notifications: appendNotification(manuscript, {
          type: "revision-submitted",
          recipientRole: "associate_editor",
          message: notifMessage,
        }),
        audit_logs: appendAudit(
          manuscript,
          "author",
          nextStatus === "Pending Format Verification"
            ? "intake-revision-submitted"
            : "revision-submitted",
          payload.authorNote
        ),
      });

      return save(manuscript.id, {
        status: nextStatus,
        file_url: publicUrl,
        submission_metadata: nextMeta,
      });
    },
    [save, user?.id]
  );

  const grantExtension = useCallback(
    async (manuscript: Manuscript, reason: string) => {
      const { error: insertError } = await insertRevisionExtensionGrant(manuscript.id, reason);
      if (insertError) {
        toast.error(insertError.message);
        return false;
      }
      const nextMeta = metadataPatch(manuscript, {
        audit_logs: appendAudit(manuscript, "editor", "revision-extension-granted", reason),
      });
      return save(manuscript.id, { submission_metadata: nextMeta });
    },
    [save]
  );

  return {
    manuscripts: revisionManuscripts,
    fetchManuscripts,
    submitRevision,
    grantExtension,
  };
}
