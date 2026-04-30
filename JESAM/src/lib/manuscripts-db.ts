import { supabase } from "@/lib/supabase";
import type {
  Manuscript,
  ManuscriptStatus,
  SubmissionMetadata,
  JournalClassification,
} from "@/types";
import { normalizeManuscriptRow } from "@/types";
import type { AppRole } from "@/types";

const BUCKET = "manuscript-files";

export function buildUniqueReferenceCode(): string {
  const year = new Date().getFullYear();
  const n = Math.floor(10000 + Math.random() * 90000);
  return `JESAM-${year}-${n}`;
}

export interface ListManuscriptsOptions {
  userId: string | undefined;
  role: AppRole | null;
  /** When set, only rows with this status */
  status?: ManuscriptStatus;
  /** When true, only statuses in the publication pipeline */
  publicationStatusesOnly?: boolean;
}

export async function listManuscriptsFromDb(
  options: ListManuscriptsOptions
): Promise<{ data: Manuscript[]; error: Error | null }> {
  const { userId, role, status, publicationStatusesOnly } = options;

  let query = supabase
    .from("manuscripts")
    .select("*, metrics:article_metrics(*)")
    .order("created_at", { ascending: false });

  if (role === "author" && userId) {
    query = query.eq("submitter_id", userId);
  }

  if (status) {
    query = query.eq("status", status);
  } else if (publicationStatusesOnly) {
    const pub = [
      "Accepted",
      "In Production",
      "Published",
      "Return to Revision",
      "Retracted",
    ] as const;
    query = query.in("status", [...pub]);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const normalized = (data || []).map((row) => {
    const r = row as Record<string, unknown>;
    const m = r.metrics;
    if (Array.isArray(m) && m[0]) {
      r.metrics = m[0];
    }
    return normalizeManuscriptRow(r);
  });

  return { data: normalized, error: null };
}

export interface CreateManuscriptInput {
  submitter_id: string;
  title: string;
  abstract: string;
  /** Display author strings for DB `authors` json/jsonb */
  authors: string[];
  keywords: string[];
  classification: JournalClassification;
  status: ManuscriptStatus;
  submission_metadata: SubmissionMetadata;
  reference_code?: string;
}

export async function insertManuscript(
  input: CreateManuscriptInput
): Promise<{ data: Manuscript | null; error: Error | null }> {
  let reference_code = input.reference_code ?? buildUniqueReferenceCode();
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const row = {
      submitter_id: input.submitter_id,
      title: input.title,
      abstract: input.abstract,
      authors: input.authors,
      keywords: input.keywords,
      classification: input.classification,
      status: input.status,
      submission_metadata: input.submission_metadata as Record<string, unknown>,
      reference_code,
    };

    const { data, error } = await supabase
      .from("manuscripts")
      .insert([row])
      .select("*")
      .single();

    if (!error && data) {
      return { data: normalizeManuscriptRow(data as Record<string, unknown>), error: null };
    }

    if (
      error?.message?.includes("duplicate") ||
      error?.code === "23505"
    ) {
      reference_code = buildUniqueReferenceCode();
      continue;
    }

    return { data: null, error: new Error(error?.message ?? "Insert failed") };
  }

  return { data: null, error: new Error("Could not allocate unique reference_code") };
}

export async function updateManuscriptRow(
  id: string,
  updates: Record<string, unknown>
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("manuscripts").update(updates).eq("id", id);

  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export async function getManuscriptByIdFromDb(
  id: string
): Promise<{ data: Manuscript | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("manuscripts")
    .select("*, metrics:article_metrics(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { data: null, error: error ? new Error(error.message) : new Error("Not found") };
  }

  const r = data as Record<string, unknown>;
  const m = r.metrics;
  if (Array.isArray(m) && m[0]) {
    r.metrics = m[0];
  }

  return { data: normalizeManuscriptRow(r), error: null };
}

export async function uploadManuscriptFileToStorage(
  manuscriptId: string,
  file: File
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const filePath = `manuscripts/${manuscriptId}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return {
      publicUrl: null,
      error: new Error(
        `Storage upload failed for bucket "${BUCKET}" at "${filePath}": ${uploadError.message}`
      ),
    };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  if (!urlData?.publicUrl) {
    return {
      publicUrl: null,
      error: new Error(
        `Upload succeeded but public URL could not be generated for "${BUCKET}/${filePath}"`
      ),
    };
  }
  return { publicUrl: urlData.publicUrl, error: null };
}
