import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { depositDOI, generateDOIString } from "@/lib/crossref";
import { useAuth } from "@/contexts/AuthContext";
import type { Manuscript, ManuscriptStatus, ReadinessStatus } from "../types";

export function useManuscripts(filterStatus?: ManuscriptStatus) {
  const { user, role } = useAuth();
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch manuscripts from Supabase with optional status filter
  const fetchManuscripts = useCallback(async () => {
    // If auth state hasn't resolved yet, do nothing
    if (!user || !role) return;

    setLoading(true);
    setError(null);

    let query = supabase
      .from("manuscripts")
      .select("*, metrics:article_metrics(*)")
      .order("created_at", { ascending: false });

    // ── RBAC Logic: Filter by submitter_id if user is an author ──
    if (role === "author") {
      query = query.eq("submitter_id", user.id);
    }

    if (filterStatus) {
      query = query.eq("status", filterStatus);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      toast.error(`Failed to fetch manuscripts: ${fetchError.message}`);
    } else {
      // Supabase returns metrics as an array from the join; normalize to single object
      const normalized = (data || []).map((m) => ({
        ...m,
        metrics: Array.isArray(m.metrics) ? m.metrics[0] || null : m.metrics,
      })) as Manuscript[];
      setManuscripts(normalized);
    }

    setLoading(false);
  }, [filterStatus, user?.id, role]);

  useEffect(() => {
    fetchManuscripts();
  }, [fetchManuscripts]);

  // Get a single manuscript by ID
  const getById = useCallback(
    async (id: string): Promise<Manuscript | null> => {
      const { data, error: fetchError } = await supabase
        .from("manuscripts")
        .select("*, metrics:article_metrics(*)")
        .eq("id", id)
        .single();

      if (fetchError || !data) return null;

      return {
        ...data,
        metrics: Array.isArray(data.metrics) ? data.metrics[0] || null : data.metrics,
      } as Manuscript;
    },
    []
  );

  // Compute readiness status from manuscript fields
  const getReadinessStatus = useCallback(
    (manuscript: Manuscript): ReadinessStatus => {
      const hasMetadata =
        !!manuscript.title &&
        manuscript.authors.length > 0 &&
        manuscript.keywords.length > 0;
      const hasFile = !!manuscript.file_url;
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

  // Generic update helper
  const updateManuscript = useCallback(
    async (id: string, updates: Partial<Manuscript>): Promise<boolean> => {
      const { error: updateError } = await supabase
        .from("manuscripts")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        toast.error(`Update failed: ${updateError.message}`);
        return false;
      }

      // Optimistic local update
      setManuscripts((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
      return true;
    },
    []
  );

  // Save metadata (title, authors, abstract, keywords)
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

  // Upload file to Supabase Storage and save file_url
  const uploadFile = useCallback(
    async (id: string, file: File): Promise<boolean> => {
      const filePath = `manuscripts/${id}/${file.name}`;

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

  // Assign DOI manually
  const assignDOI = useCallback(
    async (id: string, doi: string) => {
      const success = await updateManuscript(id, { doi });
      if (success) toast.success("DOI assigned successfully");
      return success;
    },
    [updateManuscript]
  );

  // Auto-generate DOI via Crossref
  const autoGenerateDOI = useCallback(
    async (
      id: string
    ): Promise<{ success: boolean; doi: string; error?: string }> => {
      const manuscript = manuscripts.find((m) => m.id === id);
      if (!manuscript) {
        // Fetch fresh if not in local state
        const fresh = await getById(id);
        if (!fresh) return { success: false, doi: "", error: "Manuscript not found" };

        const result = await depositDOI(fresh);
        if (result.success) {
          await updateManuscript(id, { doi: result.doi });
        }
        return result;
      }

      const result = await depositDOI(manuscript);
      if (result.success) {
        await updateManuscript(id, { doi: result.doi });
      } else {
        // Still provide a generated DOI string for manual entry
        const fallbackDOI = generateDOIString(manuscript);
        return { ...result, doi: fallbackDOI };
      }
      return result;
    },
    [manuscripts, getById, updateManuscript]
  );

  // Publish manuscript — triggers status + published_at + initial metrics
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
      };

      const success = await updateManuscript(id, updates);
      if (!success) return false;

      // Create initial metrics row
      const { error: metricsError } = await supabase
        .from("article_metrics")
        .insert([
          { manuscript_id: id, views: 0, downloads: 0, citations: 0 },
        ]);

      if (metricsError) {
        console.error("Failed to create metrics row:", metricsError);
      }

      toast.success("🎉 Article successfully published!");
      return true;
    },
    [manuscripts, getReadinessStatus, updateManuscript]
  );

  // Return to Revision
  const returnToRevision = useCallback(
    async (id: string) => {
      const success = await updateManuscript(id, {
        status: "Return to Revision" as ManuscriptStatus,
      });
      if (success) toast.success("Manuscript returned to revision");
      return success;
    },
    [updateManuscript]
  );

  // Mark as Retracted
  const retractManuscript = useCallback(
    async (id: string) => {
      const success = await updateManuscript(id, {
        status: "Retracted" as ManuscriptStatus,
      });
      if (success) toast.error("Article has been retracted");
      return success;
    },
    [updateManuscript]
  );

  // Assign issue
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

  // Increment download counter
  const incrementDownload = useCallback(async (manuscriptId: string) => {
    // Use a direct update to increment
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

  // Refresh metrics from DB
  const refreshMetrics = useCallback(
    async (id: string) => {
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
    },
    []
  );

  return {
    manuscripts,
    loading,
    error,
    fetchManuscripts,
    getById,
    getReadinessStatus,
    updateManuscript,
    saveMetadata,
    uploadFile,
    assignDOI,
    autoGenerateDOI,
    publishManuscript,
    returnToRevision,
    retractManuscript,
    assignIssue,
    incrementDownload,
    refreshMetrics,
  };
}
