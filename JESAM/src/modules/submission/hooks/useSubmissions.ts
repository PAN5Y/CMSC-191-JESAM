import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  listManuscriptsFromDb,
  insertManuscript,
  updateManuscriptRow,
  uploadManuscriptFileToStorage,
} from "@/lib/manuscripts-db";
import type {
  Manuscript,
  ManuscriptStatus,
  JournalClassification,
  SubmissionMetadata,
} from "@/types";
import type { ScreeningDecision } from "../types";
import { appendAudit, appendNotification } from "@/lib/workflow";

export interface CreateManuscriptFromWizardInput {
  metadata: {
    title: string;
    abstract: string;
    keywords: string;
    focus: string;
    subjectArea: string;
    funding: string;
    competingInterests: string;
    ethicalApprovals: string;
  };
  authors: Array<{
    id: string;
    name: string;
    email: string;
    orcid?: string;
    affiliation: string;
    isCorresponding: boolean;
  }>;
  checks: {
    formatting: { status: string; message: string };
    assets: { status: string; message: string };
    plagiarism: { status: string; message: string };
  };
  declarations: {
    noCompetingInterests: boolean;
    ethicalStandards: boolean;
    dataAvailability: boolean;
    authorshipContribution: boolean;
  };
  manuscriptFile: File | null;
}

function parseSimilarityFromMessage(message: string): number | undefined {
  const m = message.match(/(\d+(?:\.\d+)?)%/);
  if (m) return parseFloat(m[1]);
  return undefined;
}

function buildSubmissionMetadata(input: CreateManuscriptFromWizardInput): SubmissionMetadata {
  const sim =
    parseSimilarityFromMessage(input.checks.plagiarism.message) ??
    (input.checks.plagiarism.message.includes("%")
      ? undefined
      : undefined);

  return {
    funding: input.metadata.funding,
    subjectArea: input.metadata.subjectArea,
    competingInterests: input.metadata.competingInterests,
    ethicalApprovals: input.metadata.ethicalApprovals,
    author_details: input.authors,
    automated_checks: {
      formatting: input.checks.formatting,
      assets: input.checks.assets,
      plagiarism: input.checks.plagiarism,
    },
    similarity_score: sim,
    declarations: input.declarations,
  };
}

export function useSubmissions() {
  const { user, role } = useAuth();
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManuscripts = useCallback(async () => {
    if (!user || !role) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await listManuscriptsFromDb({
      userId: user.id,
      role,
      publicationStatusesOnly: false,
    });

    if (fetchError) {
      setError(fetchError.message);
      toast.error(`Failed to fetch manuscripts: ${fetchError.message}`);
      setManuscripts([]);
    } else {
      setManuscripts(data);
    }

    setLoading(false);
  }, [user?.id, role]);

  const getManuscriptById = useCallback(
    (id: string) => manuscripts.find((m) => m.id === id),
    [manuscripts]
  );

  const createManuscript = useCallback(
    async (input: CreateManuscriptFromWizardInput): Promise<Manuscript | null> => {
      if (!user?.id) {
        toast.error("You must be signed in to submit.");
        return null;
      }
      if (!input.manuscriptFile) {
        const msg = "Please upload your manuscript file before submitting.";
        setError(msg);
        toast.error(msg);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const classification = input.metadata.focus as JournalClassification;
        const keywords = input.metadata.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);
        const authorStrings = input.authors.map((a) => a.name.trim());

        const submission_metadata: SubmissionMetadata = {
          ...buildSubmissionMetadata(input),
          similarity_score:
            parseSimilarityFromMessage(input.checks.plagiarism.message),
          notifications: [
            {
              id: `notif-${Date.now()}`,
              type: "submission-received",
              recipientRole: "author",
              recipientEmail: user.email,
              message:
                "Submission received. A handling editor will verify formatting; then the Editor-in-Chief will screen the manuscript.",
              createdAt: new Date().toISOString(),
              delivered: true,
            },
          ],
          audit_logs: [
            {
              id: `audit-${Date.now()}`,
              actor: user.email ?? user.id,
              action: "submission-created",
              note: "Initial manuscript submission",
              createdAt: new Date().toISOString(),
            },
          ],
        };

        const { data: created, error: insertErr } = await insertManuscript({
          submitter_id: user.id,
          title: input.metadata.title.trim(),
          abstract: input.metadata.abstract.trim(),
          authors: authorStrings,
          keywords,
          classification,
          status: "Pending Format Verification",
          submission_metadata,
        });

        if (insertErr || !created) {
          const msg = insertErr?.message ?? "Failed to create manuscript";
          setError(msg);
          toast.error(msg);
          return null;
        }

        let finalizedManuscript: Manuscript = created;

        const { publicUrl, error: upErr } = await uploadManuscriptFileToStorage(
          created.id,
          input.manuscriptFile
        );
        if (upErr) {
          toast.error(`Manuscript saved but file upload failed: ${upErr.message}`);
        } else if (publicUrl) {
          const { error: persistUrlErr } = await updateManuscriptRow(created.id, {
            file_url: publicUrl,
          });
          if (persistUrlErr) {
            toast.error(`File uploaded but URL save failed: ${persistUrlErr.message}`);
          } else {
            finalizedManuscript = { ...created, file_url: publicUrl };
          }
        } else {
          toast.error("Manuscript saved but file upload returned an empty URL.");
        }

        setManuscripts((prev) => [finalizedManuscript, ...prev]);
        toast.success("Manuscript submitted successfully.");
        return finalizedManuscript;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create manuscript";
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  const updateManuscriptStatus = useCallback(
    async (id: string, status: ManuscriptStatus) => {
      setLoading(true);
      try {
        const { error: upErr } = await updateManuscriptRow(id, { status });
        if (upErr) {
          setError(upErr.message);
          toast.error(upErr.message);
          return;
        }
        setManuscripts((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status } : m))
        );
        setError(null);
        toast.success("Status updated.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const recordScreeningDecision = useCallback(
    async (decision: ScreeningDecision) => {
      setLoading(true);
      try {
        const newStatus: ManuscriptStatus =
          decision.decision === "approve"
            ? "Peer Review"
            : decision.decision === "reject"
              ? "Rejected"
              : "Returned to Author";

        const metaPatch: Partial<SubmissionMetadata> = {
          screening_comments: decision.comments,
          screening_decided_at: decision.decidedAt,
          screening_decided_by: decision.decidedBy,
        };
        if (decision.decision === "reject") {
          metaPatch.rejection_reason = decision.rejectionReason;
        }

        const existing = manuscripts.find((m) => m.id === decision.id);
        const prevMeta = existing?.submission_metadata ?? {};
        const submission_metadata = {
          ...prevMeta,
          ...metaPatch,
          notifications: appendNotification(existing ?? ({} as Manuscript), {
            type: "screening-decision",
            recipientRole: "author",
            message: `Screening decision applied: ${decision.decision}.`,
          }),
          audit_logs: appendAudit(
            existing ?? ({} as Manuscript),
            decision.decidedBy,
            "screening-decision",
            decision.decision
          ),
        } as SubmissionMetadata;

        const { error: upErr } = await updateManuscriptRow(decision.id, {
          status: newStatus,
          submission_metadata: submission_metadata as unknown as Record<string, unknown>,
        });

        if (upErr) {
          setError(upErr.message);
          toast.error(upErr.message);
          return;
        }

        setManuscripts((prev) =>
          prev.map((m) =>
            m.id === decision.id
              ? { ...m, status: newStatus, submission_metadata }
              : m
          )
        );
        setError(null);
        toast.success("Screening decision recorded.");
      } finally {
        setLoading(false);
      }
    },
    [manuscripts]
  );

  const recordEditorVerification = useCallback(
    async (id: string, outcome: "approve" | "return", comments?: string) => {
      setLoading(true);
      try {
        if (outcome === "approve") {
          const { error: upErr } = await updateManuscriptRow(id, {
            status: "Editor In Chief Screening",
          });
          if (upErr) {
            toast.error(upErr.message);
            return;
          }
          setManuscripts((prev) =>
            prev.map((m) =>
              m.id === id ? { ...m, status: "Editor In Chief Screening" } : m
            )
          );
          toast.success("Manuscript moved to Editor-in-Chief screening.");
          return;
        }

        const existing = manuscripts.find((m) => m.id === id);
        const prevMeta = existing?.submission_metadata ?? {};
        const submission_metadata: SubmissionMetadata = {
          ...prevMeta,
          editor_verification_comments: comments,
        };

        const { error: upErr } = await updateManuscriptRow(id, {
          status: "Returned to Author",
          submission_metadata: submission_metadata as unknown as Record<string, unknown>,
        });

        if (upErr) {
          toast.error(upErr.message);
          return;
        }

        setManuscripts((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, status: "Returned to Author", submission_metadata }
              : m
          )
        );
        toast.success("Manuscript returned to author.");
      } finally {
        setLoading(false);
      }
    },
    [manuscripts]
  );

  return {
    manuscripts,
    loading,
    error,
    fetchManuscripts,
    getManuscriptById,
    createManuscript,
    updateManuscriptStatus,
    recordScreeningDecision,
    recordEditorVerification,
  };
}
