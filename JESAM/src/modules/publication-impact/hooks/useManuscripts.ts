import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { depositToZenodo } from "@/lib/zenodo";
import { generateDOIString } from "@/lib/crossref";
import {
  listManuscriptsFromDb,
  updateManuscriptRow,
  getManuscriptByIdFromDb,
} from "@/lib/manuscripts-db";
import {
  fetchLatestGalleyVersionsBatch,
  fetchGalleyVersions as fetchGalleyVersionsFromDb,
  insertGalleyVersion,
} from "@/lib/galley-versions-db";
import { useAuth } from "@/contexts/AuthContext";
import type { Manuscript, ManuscriptStatus, ReadinessStatus, SubmissionMetadata } from "../types";
import type { GalleyVersion } from "@/types";
import { appendAudit, appendNotification } from "@/lib/workflow";

/* ── Publication-pipeline status definitions (tooltips) ── */
export const STATUS_DEFINITIONS: Record<string, string> = {
  "In Layout": "Preparing formatted HTML/PDF/PS galleys",
  Proofreading: "Reviewing galleys for typographical errors",
  "Author Galley Review": "Final check by author before locking the file",
  "Scheduled for Publication": "Assigned to an issue / Table of Contents",
  "In Issue Management": "Finalizing issue organization",
  Published: "Article is live and publicly accessible",
  Archived: "Manuscript archived after completion",
  Declined: "Manuscript declined (terminal)",
};

/* ── Pipeline stages in order (for the stepper) ── */
export const PIPELINE_STAGES: ManuscriptStatus[] = [
  "In Layout",
  "Proofreading",
  "Author Galley Review",
  "Scheduled for Publication",
  "In Issue Management",
  "Published",
];

/* ── Valid forward transitions ── */
const FORWARD_TRANSITIONS: Partial<Record<ManuscriptStatus, ManuscriptStatus>> = {
  "In Layout": "Proofreading",
  Proofreading: "Author Galley Review",
  "Author Galley Review": "Scheduled for Publication",
  "Scheduled for Publication": "In Issue Management",
  "In Issue Management": "Published",
};

/* ── Valid return (loop) transitions ── */
const RETURN_TRANSITIONS: Partial<Record<ManuscriptStatus, ManuscriptStatus>> = {
  Proofreading: "In Layout",
  "Author Galley Review": "Proofreading",
};

export interface UseManuscriptsOptions {
  filterStatus?: ManuscriptStatus;
  /** When true, only load post-acceptance pipeline rows (publication dashboard). */
  publicationOnly?: boolean;
}

export function useManuscripts(options?: UseManuscriptsOptions) {
  const filterStatus = options?.filterStatus;
  const publicationOnly = options?.publicationOnly ?? false;
  const { user, role } = useAuth();
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Galley version state ── */
  const [latestGalleys, setLatestGalleys] = useState<Map<string, GalleyVersion>>(new Map());
  const [galleyVersionsMap, setGalleyVersionsMap] = useState<Map<string, GalleyVersion[]>>(new Map());

  const fetchManuscripts = useCallback(async () => {
    if (!user || !role) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await listManuscriptsFromDb({
      userId: user.id,
      role,
      status: filterStatus,
      publicationStatusesOnly: publicationOnly,
    });

    if (fetchError) {
      setError(fetchError.message);
      toast.error(`Failed to fetch manuscripts: ${fetchError.message}`);
      setManuscripts([]);
    } else {
      setManuscripts(data);

      // Fetch latest galley versions for all manuscripts in batch
      if (data.length > 0) {
        const ids = data.map((m) => m.id);
        const latestMap = await fetchLatestGalleyVersionsBatch(ids);
        setLatestGalleys(latestMap);
      }
    }

    setLoading(false);
  }, [filterStatus, publicationOnly, user?.id, role]);

  useEffect(() => {
    fetchManuscripts();
  }, [fetchManuscripts]);

  /** Fetch all galley versions for a single manuscript (for version history). */
  const fetchGalleyVersionsForManuscript = useCallback(
    async (manuscriptId: string): Promise<GalleyVersion[]> => {
      const cached = galleyVersionsMap.get(manuscriptId);
      if (cached) return cached;

      const { data } = await fetchGalleyVersionsFromDb(manuscriptId);
      setGalleyVersionsMap((prev) => new Map(prev).set(manuscriptId, data));
      return data;
    },
    [galleyVersionsMap]
  );

  const getById = useCallback(async (id: string): Promise<Manuscript | null> => {
    const { data, error: fetchError } = await getManuscriptByIdFromDb(id);
    if (fetchError || !data) return null;
    return data;
  }, []);

  const getReadinessStatus = useCallback(
    (manuscript: Manuscript): ReadinessStatus => {
      const hasMetadata =
        !!manuscript.title &&
        manuscript.authors.length > 0 &&
        manuscript.keywords.length > 0;
      // In the Publication & Impact module, we assume an initial file exists 
      // from the submission or revision process, so we default to true.
      const hasFile = true;
      const hasDOI = !!manuscript.doi;

      return {
        metadataComplete: hasMetadata,
        filesReady: hasFile,
        doiAssigned: hasDOI,
        isReady: hasMetadata && hasFile && hasDOI,
      };
    },
    []
  );

  const updateManuscript = useCallback(
    async (id: string, updates: Partial<Manuscript>): Promise<boolean> => {
      const payload: Record<string, unknown> = { ...updates };
      if (payload.submission_metadata && typeof payload.submission_metadata === "object") {
        payload.submission_metadata = payload.submission_metadata as Record<string, unknown>;
      }

      const { error: updateError } = await updateManuscriptRow(id, payload);

      if (updateError) {
        toast.error(`Update failed: ${updateError.message}`);
        return false;
      }

      setManuscripts((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
      return true;
    },
    []
  );

  /* ── Publication pipeline state machine ── */
  const transitionStatus = useCallback(
    async (
      id: string,
      targetStatus: ManuscriptStatus,
      opts?: { isReturn?: boolean }
    ): Promise<boolean> => {
      const manuscript = manuscripts.find((m) => m.id === id);
      if (!manuscript) {
        toast.error("Manuscript not found");
        return false;
      }

      const currentStatus = manuscript.status;
      const actorRole = role ?? "system_admin";
      const reference = manuscript.reference_code ?? manuscript.id.slice(0, 8);

      // Validate transition
      const isTerminal = targetStatus === "Archived" || targetStatus === "Declined";
      const isForward = FORWARD_TRANSITIONS[currentStatus] === targetStatus;
      const isReturn = RETURN_TRANSITIONS[currentStatus] === targetStatus;

      if (!isTerminal && !isForward && !isReturn) {
        toast.error(`Invalid transition: ${currentStatus} → ${targetStatus}`);
        return false;
      }

      // ── No-skip gate: Schedule for Publication requires author_approved ──
      if (targetStatus === "Scheduled for Publication" && !manuscript.author_approved) {
        toast.error("Cannot schedule: Author has not approved the galley yet.");
        return false;
      }

      // Build updates
      const updates: Partial<Manuscript> = {
        status: targetStatus,
      };

      // Audit + notifications
      let auditAction = `status-transition:${currentStatus}→${targetStatus}`;
      if (opts?.isReturn) {
        auditAction = `return:${currentStatus}→${targetStatus}`;
      }

      const newAuditLogs = appendAudit(manuscript, actorRole, auditAction);
      const prevMeta = manuscript.submission_metadata ?? {};
      let newNotifications = prevMeta.notifications ?? [];

      // Special: Author Galley Review entry → notify the author
      if (targetStatus === "Author Galley Review") {
        newNotifications = appendNotification(manuscript, {
          type: "revision-requested",
          recipientRole: "author",
          message: `${reference}: Your galley proof is ready for review. Please approve or request corrections.`,
        });
        toast.success("Author notification sent for galley review");
      }

      // Special: Published → set published_at
      if (targetStatus === "Published") {
        updates.published_at = new Date().toISOString();
        newNotifications = appendNotification(manuscript, {
          type: "published",
          recipientRole: "public",
          message: `${reference} is now published.`,
        });
      }

      // Special: Declined → notify author
      if (targetStatus === "Declined") {
        newNotifications = appendNotification(manuscript, {
          type: "screening-decision",
          recipientRole: "author",
          message: `${reference} has been declined in the publication stage.`,
        });
      }

      updates.submission_metadata = {
        ...prevMeta,
        audit_logs: newAuditLogs,
        notifications: newNotifications,
      };

      // ── Proactive DOI Generation ──
      // Automatically generate a DOI string when entering the publication pipeline
      if (targetStatus === "In Layout" && !manuscript.doi) {
        const generatedDoi = generateDOIString(manuscript);
        updates.doi = generatedDoi;
        toast.info(`Pre-generated DOI: ${generatedDoi}`);
      }

      const success = await updateManuscript(id, updates);

      if (!success) return false;

      // Special: Published → insert metrics row
      if (targetStatus === "Published") {
        const { error: metricsError } = await supabase
          .from("article_metrics")
          .insert([
            { manuscript_id: id, views: 0, downloads: 0, citations: 0 },
          ]);

        if (metricsError) {
          console.error("Failed to create metrics row:", metricsError);
        }
      }

      const label = opts?.isReturn ? "returned to" : "moved to";
      toast.success(`${reference} ${label} ${targetStatus}`);
      return true;
    },
    [manuscripts, role, updateManuscript]
  );

  /* ── Complete Layout: upload galley file + move to Proofreading ── */
  const completeLayout = useCallback(
    async (id: string, file: File | null, note: string): Promise<boolean> => {
      const manuscript = manuscripts.find((m) => m.id === id);
      if (!manuscript) {
        toast.error("Manuscript not found");
        return false;
      }
      if (manuscript.status !== "In Layout") {
        toast.error("Can only complete layout when status is 'In Layout'");
        return false;
      }
      if (!user?.id) {
        toast.error("You must be signed in");
        return false;
      }

      let versionStr = "without new file";

      if (file) {
        // Upload galley file + insert version row
        const { data: version, error: insertError } = await insertGalleyVersion(
          id, file, user.id, note
        );

        if (insertError || !version) {
          toast.error(`Failed to upload galley: ${insertError?.message ?? "Unknown error"}`);
          return false;
        }

        // Update latest galley cache
        setLatestGalleys((prev) => new Map(prev).set(id, version));
        // Invalidate full version list cache
        setGalleyVersionsMap((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });

        versionStr = `v${version.revision_number}`;
      }

      // Transition to Proofreading
      const actorRole = role ?? "system_admin";
      const reference = manuscript.reference_code ?? manuscript.id.slice(0, 8);
      const prevMeta = manuscript.submission_metadata ?? {};

      const updates: Partial<Manuscript> = {
        status: "Proofreading" as ManuscriptStatus,
        submission_metadata: {
          ...prevMeta,
          audit_logs: appendAudit(manuscript, actorRole, `layout-completed:${versionStr}`, note),
          notifications: appendNotification(manuscript, {
            type: "revision-requested",
            recipientRole: "author",
            message: `${reference}: Layout ${versionStr} completed. Moving to proofreading.`,
          }),
        },
      };

      const success = await updateManuscript(id, updates);
      if (success) {
        toast.success(`Layout completed ${versionStr} — moved to Proofreading`);
      }
      return success;
    },
    [manuscripts, user, role, updateManuscript]
  );

  /* ── Proofreading decision: return to layout or send to author ── */
  const proofreadingDecision = useCallback(
    async (
      id: string,
      decision: "return" | "approve",
      remarks: string,
      file: File | null = null
    ): Promise<boolean> => {
      const manuscript = manuscripts.find((m) => m.id === id);
      if (!manuscript) {
        toast.error("Manuscript not found");
        return false;
      }
      if (manuscript.status !== "Proofreading") {
        toast.error("Decision can only be made during Proofreading");
        return false;
      }

      let versionStr = "without new file";
      if (file) {
        if (!user?.id) {
          toast.error("You must be signed in to upload a file");
          return false;
        }
        const { data: version, error: insertError } = await insertGalleyVersion(
          id, file, user.id, remarks
        );

        if (insertError || !version) {
          toast.error(`Failed to upload galley: ${insertError?.message ?? "Unknown error"}`);
          return false;
        }

        setLatestGalleys((prev) => new Map(prev).set(id, version));
        setGalleyVersionsMap((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });

        versionStr = `v${version.revision_number}`;
      }

      const actorRole = role ?? "system_admin";
      const reference = manuscript.reference_code ?? manuscript.id.slice(0, 8);
      const prevMeta = manuscript.submission_metadata ?? {};

      const targetStatus: ManuscriptStatus =
        decision === "return" ? "In Layout" : "Author Galley Review";

      const auditAction =
        decision === "return"
          ? `proofreading-return:Proofreading→In Layout (${versionStr})`
          : `proofreading-approve:Proofreading→Author Galley Review (${versionStr})`;

      const notifMessage =
        decision === "return"
          ? `${reference}: Returned to layout for corrections. Editor remarks: "${remarks.slice(0, 100)}${remarks.length > 100 ? "..." : ""}"`
          : `${reference}: Your galley proof is ready for final review. Please review and approve.`;

      // Reset author_approved when sending to author review
      const updates: Partial<Manuscript> = {
        status: targetStatus,
        editor_remarks: remarks,
        ...(decision === "approve" ? { author_approved: false } : {}),
        submission_metadata: {
          ...prevMeta,
          audit_logs: appendAudit(manuscript, actorRole, auditAction, remarks),
          notifications: appendNotification(manuscript, {
            type: "revision-requested",
            recipientRole: "author",
            message: notifMessage,
          }),
        },
      };

      const success = await updateManuscript(id, updates);
      if (!success) return false;

      if (decision === "return") {
        toast.success(`Returned to layout with remarks ${versionStr}`);
      } else {
        toast.success(`Sent to Author Galley Review ${versionStr}`);
      }
      return true;
    },
    [manuscripts, role, updateManuscript]
  );

  /* ── Author approves the galley (sets author_approved = true, moves to Scheduled) ── */
  const authorApproveGalley = useCallback(
    async (id: string): Promise<boolean> => {
      const manuscript = manuscripts.find((m) => m.id === id);
      if (!manuscript) {
        // Try fetching fresh
        const fresh = await getById(id);
        if (!fresh) {
          toast.error("Manuscript not found");
          return false;
        }
      }
      const ms = manuscript ?? (await getById(id))!;
      const reference = ms.reference_code ?? ms.id.slice(0, 8);
      const prevMeta = ms.submission_metadata ?? {};

      const updates: Partial<Manuscript> = {
        status: "Scheduled for Publication" as ManuscriptStatus,
        author_approved: true,
        submission_metadata: {
          ...prevMeta,
          audit_logs: appendAudit(ms, "author", "author-galley-approved"),
          notifications: appendNotification(ms, {
            type: "accepted",
            recipientRole: "production_editor",
            message: `${reference}: Author has approved the galley proof. Ready for scheduling.`,
          }),
        },
      };

      const success = await updateManuscript(id, updates);
      if (success) {
        toast.success("Galley approved — moved to Scheduled for Publication");
      }
      return success;
    },
    [manuscripts, getById, updateManuscript]
  );

  /* ── Author requests corrections (returns to Proofreading) ── */
  const authorRequestCorrections = useCallback(
    async (id: string, file: File, remarks: string): Promise<boolean> => {
      const manuscript = manuscripts.find((m) => m.id === id);
      if (!manuscript) {
        toast.error("Manuscript not found");
        return false;
      }
      if (!user?.id) {
        toast.error("You must be signed in");
        return false;
      }

      // Upload correction file + insert version row
      const { data: version, error: insertError } = await insertGalleyVersion(
        id, file, user.id, remarks
      );

      if (insertError || !version) {
        toast.error(`Failed to upload correction file: ${insertError?.message ?? "Unknown error"}`);
        return false;
      }

      // Update caches
      setLatestGalleys((prev) => new Map(prev).set(id, version));
      setGalleyVersionsMap((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });

      const reference = manuscript.reference_code ?? manuscript.id.slice(0, 8);
      const prevMeta = manuscript.submission_metadata ?? {};

      const updates: Partial<Manuscript> = {
        status: "In Layout" as ManuscriptStatus,
        author_approved: false,
        editor_remarks: `Author Correction Request:\n${remarks}`,
        submission_metadata: {
          ...prevMeta,
          audit_logs: appendAudit(manuscript, "author", "author-galley-corrections-requested", remarks),
          notifications: appendNotification(manuscript, {
            type: "revision-requested",
            recipientRole: "production_editor",
            message: `${reference}: Author has requested corrections to the galley proof.`,
          }),
        },
      };

      const success = await updateManuscript(id, updates);
      if (success) {
        toast.success("Corrections requested — returned to Layout for updates");
      }
      return success;
    },
    [manuscripts, updateManuscript, user?.id]
  );

  const saveMetadata = useCallback(
    async (
      id: string,
      data: { title: string; authors: string[]; abstract: string; keywords: string[] }
    ) => {
      const success = await updateManuscript(id, data);
      if (success) toast.success("Metadata updated successfully");
      return success;
    },
    [updateManuscript]
  );

  const uploadFile = useCallback(
    async (id: string, file: File): Promise<boolean> => {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `manuscripts/${id}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("manuscript-files")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        return false;
      }

      const { data: urlData } = supabase.storage
        .from("manuscript-files")
        .getPublicUrl(filePath);

      const success = await updateManuscript(id, {
        file_url: urlData.publicUrl,
      });

      if (success) toast.success("File uploaded successfully");
      return success;
    },
    [updateManuscript]
  );

  const assignDOI = useCallback(
    async (id: string, doi: string) => {
      const success = await updateManuscript(id, { doi });
      if (success) toast.success("DOI assigned successfully");
      return success;
    },
    [updateManuscript]
  );

  const autoGenerateDOI = useCallback(
    async (
      id: string
    ): Promise<{ success: boolean; doi: string; error?: string }> => {
      const manuscript = manuscripts.find((m) => m.id === id);
      if (!manuscript) {
        const fresh = await getById(id);
        if (!fresh) return { success: false, doi: "", error: "Manuscript not found" };

        const result = await depositToZenodo(fresh);
        if (result.success) {
          toast.success(`Zenodo DOI successfully generated: ${result.doi}`);
          await updateManuscript(id, { doi: result.doi });
        } else {
          toast.error(`Zenodo DOI generation failed: ${result.error || "Unknown error"}`);
        }
        return result;
      }

      const result = await depositToZenodo(manuscript);
      if (result.success) {
        toast.success(`Zenodo DOI successfully generated: ${result.doi}`);
        await updateManuscript(id, { doi: result.doi });
      } else {
        toast.error(`Zenodo DOI generation failed: ${result.error || "Unknown error"}`);
        const fallbackDOI = generateDOIString(manuscript);
        return { ...result, doi: fallbackDOI };
      }
      return result;
    },
    [manuscripts, getById, updateManuscript]
  );

  const publishManuscript = useCallback(
    async (id: string): Promise<boolean> => {
      const manuscript = manuscripts.find((m) => m.id === id);
      if (!manuscript) return false;

      const readiness = getReadinessStatus(manuscript);
      if (!readiness.isReady) {
        toast.error(
          "Cannot publish: Please complete all readiness requirements"
        );
        return false;
      }

      const updates: Partial<Manuscript> = {
        status: "Published",
        published_at: new Date().toISOString(),
        submission_metadata: {
          ...(manuscript.submission_metadata ?? {}),
          notifications: appendNotification(manuscript, {
            type: "published",
            recipientRole: "public",
            message: `${manuscript.reference_code ?? manuscript.id} is now published.`,
          }),
          audit_logs: appendAudit(manuscript, "production_editor", "published"),
        },
      };

      // ── Automatic DOI Registration (Deposit) ──
      // When publishing, we ensure the DOI is deposited with Zenodo.
      if (manuscript.doi || updates.doi) {
        const doiToDeposit = (updates.doi as string) || (manuscript.doi as string);
        toast.info(`Depositing DOI ${doiToDeposit} with Zenodo...`);
        
        const doiResult = await depositToZenodo(manuscript);
        if (doiResult.success) {
          toast.success("DOI metadata deposited with Zenodo");
          // Track the successful deposit in metadata
          updates.submission_metadata = {
            ...(updates.submission_metadata || manuscript.submission_metadata || {}),
            doi_deposited_at: new Date().toISOString(),
          } as SubmissionMetadata;
        } else {
          toast.warning(`DOI deposit failed: ${doiResult.error}. You may need to register it manually later.`);
        }
      }

      const success = await updateManuscript(id, updates);

      if (!success) return false;

      const { error: metricsError } = await supabase
        .from("article_metrics")
        .insert([
          { manuscript_id: id, views: 0, downloads: 0, citations: 0 },
        ]);

      if (metricsError) {
        console.error("Failed to create metrics row:", metricsError);
      }

      toast.success("Article successfully published!");
      return true;
    },
    [manuscripts, getReadinessStatus, updateManuscript]
  );

  const returnToRevision = useCallback(
    async (id: string) => {
      const manuscript = manuscripts.find((m) => m.id === id);
      const reference = manuscript?.reference_code ?? manuscript?.id ?? id;
      const success = await updateManuscript(id, {
        status: "Revision Requested" as ManuscriptStatus,
        submission_metadata: {
          ...(manuscript?.submission_metadata ?? {}),
          notifications: appendNotification(manuscript ?? ({} as Manuscript), {
            type: "revision-requested",
            recipientRole: "author",
            message: `${reference} was returned by production for revision.`,
          }),
          audit_logs: appendAudit(
            manuscript ?? ({} as Manuscript),
            "production_editor",
            "returned-to-revision"
          ),
        },
      });
      if (success) toast.success("Manuscript returned to author for revision");
      return success;
    },
    [manuscripts, updateManuscript]
  );

  const retractManuscript = useCallback(
    async (id: string) => {
      const success = await updateManuscript(id, {
        status: "Retracted" as ManuscriptStatus,
        submission_metadata: {
          ...(manuscripts.find((m) => m.id === id)?.submission_metadata ?? {}),
          audit_logs: appendAudit(
            manuscripts.find((m) => m.id === id) ?? ({} as Manuscript),
            "production_editor",
            "retracted"
          ),
        },
      });
      if (success) toast.error("Article has been retracted");
      return success;
    },
    [updateManuscript]
  );

  const assignIssue = useCallback(
    async (id: string, issueAssignment: string) => {
      const success = await updateManuscript(id, {
        issue_assignment: issueAssignment,
      } as Partial<Manuscript>);
      if (success) toast.success("Issue assignment saved");
      return success;
    },
    [updateManuscript]
  );

  const incrementDownload = useCallback(async (manuscriptId: string) => {
    const { data: current } = await supabase
      .from("article_metrics")
      .select("downloads")
      .eq("manuscript_id", manuscriptId)
      .single();

    if (current) {
      await supabase
        .from("article_metrics")
        .update({ downloads: (current.downloads || 0) + 1 })
        .eq("manuscript_id", manuscriptId);
    }
  }, []);

  const refreshMetrics = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("article_metrics")
      .select("*")
      .eq("manuscript_id", id)
      .single();

    if (data) {
      setManuscripts((prev) =>
        prev.map((m) => (m.id === id ? { ...m, metrics: data } : m))
      );
      toast.success("Metrics refreshed");
    }
  }, []);

  return {
    manuscripts,
    loading,
    error,
    latestGalleys,
    galleyVersionsMap,
    fetchManuscripts,
    fetchGalleyVersionsForManuscript,
    getById,
    getReadinessStatus,
    updateManuscript,
    saveMetadata,
    uploadFile,
    assignDOI,
    autoGenerateDOI,
    transitionStatus,
    completeLayout,
    proofreadingDecision,
    authorApproveGalley,
    authorRequestCorrections,
    publishManuscript,
    returnToRevision,
    retractManuscript,
    assignIssue,
    incrementDownload,
    refreshMetrics,
  };
}
