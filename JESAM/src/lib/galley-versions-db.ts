/**
 * Database helpers for galley version tracking during the publication pipeline.
 * Uses the `manuscript_revision_versions` table to track versioned galley files.
 */
import { supabase } from "@/lib/supabase";
import type { GalleyVersion } from "@/types";
import { getNextRevisionNumber } from "@/lib/revision-db";

const BUCKET = "manuscript-files";

function mapRowToGalleyVersion(row: Record<string, unknown>): GalleyVersion {
  return {
    id: String(row.id),
    manuscript_id: String(row.manuscript_id ?? ""),
    revision_number: Number(row.revision_number ?? 1),
    file_url: String(row.file_url ?? ""),
    author_note: String(row.author_note ?? ""),
    submitter_id: (row.submitter_id as string) ?? null,
    submitted_at: String(row.submitted_at ?? new Date().toISOString()),
  };
}

/**
 * Fetch all galley versions for a manuscript, ordered by revision_number descending
 * (latest first).
 */
export async function fetchGalleyVersions(
  manuscriptId: string
): Promise<{ data: GalleyVersion[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("manuscript_revision_versions")
    .select("id, manuscript_id, revision_number, file_url, author_note, submitter_id, submitted_at")
    .eq("manuscript_id", manuscriptId)
    .order("revision_number", { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return {
    data: (data ?? []).map((r) => mapRowToGalleyVersion(r as Record<string, unknown>)),
    error: null,
  };
}

/**
 * Fetch the latest (highest revision_number) galley version for a manuscript.
 * Returns null if no versions exist.
 */
export async function fetchLatestGalleyVersion(
  manuscriptId: string
): Promise<{ data: GalleyVersion | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("manuscript_revision_versions")
    .select("id, manuscript_id, revision_number, file_url, author_note, submitter_id, submitted_at")
    .eq("manuscript_id", manuscriptId)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  if (!data) {
    return { data: null, error: null };
  }

  return {
    data: mapRowToGalleyVersion(data as Record<string, unknown>),
    error: null,
  };
}

/**
 * Fetch the latest galley version for multiple manuscripts in a single query.
 * Returns a Map keyed by manuscript_id.
 */
export async function fetchLatestGalleyVersionsBatch(
  manuscriptIds: string[]
): Promise<Map<string, GalleyVersion>> {
  const result = new Map<string, GalleyVersion>();
  if (manuscriptIds.length === 0) return result;

  const { data, error } = await supabase
    .from("manuscript_revision_versions")
    .select("id, manuscript_id, revision_number, file_url, author_note, submitter_id, submitted_at")
    .in("manuscript_id", manuscriptIds)
    .order("revision_number", { ascending: false });

  if (error || !data?.length) return result;

  // Group by manuscript_id and keep only the highest revision_number per manuscript
  for (const raw of data) {
    const row = raw as Record<string, unknown>;
    const msId = String(row.manuscript_id ?? "");
    if (!result.has(msId)) {
      result.set(msId, mapRowToGalleyVersion(row));
    }
  }

  return result;
}

/**
 * Upload a galley file to storage and insert a new version row.
 * Uses the editor's UUID as submitter_id.
 */
export async function insertGalleyVersion(
  manuscriptId: string,
  file: File,
  submitterId: string,
  authorNote: string
): Promise<{ data: GalleyVersion | null; error: Error | null }> {
  // Get next revision number
  const revisionNumber = await getNextRevisionNumber(manuscriptId);

  // Upload file to storage
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `manuscripts/${manuscriptId}/galley/v${revisionNumber}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return {
      data: null,
      error: new Error(`Galley upload failed: ${uploadError.message}`),
    };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  if (!urlData?.publicUrl) {
    return {
      data: null,
      error: new Error("Upload succeeded but could not generate public URL"),
    };
  }

  // Insert version row
  const { data, error } = await supabase
    .from("manuscript_revision_versions")
    .insert({
      manuscript_id: manuscriptId,
      revision_number: revisionNumber,
      file_url: urlData.publicUrl,
      author_note: authorNote,
      submitter_id: submitterId,
    })
    .select("id, manuscript_id, revision_number, file_url, author_note, submitter_id, submitted_at")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return {
    data: mapRowToGalleyVersion(data as Record<string, unknown>),
    error: null,
  };
}
