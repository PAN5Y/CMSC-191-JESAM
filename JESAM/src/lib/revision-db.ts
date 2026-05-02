import { supabase } from "@/lib/supabase";
import type { Manuscript, RevisionVersion, SubmissionMetadata } from "@/types";

export interface RevisionExtensionGrantRow {
  id: string;
  reason: string;
  grantedAt: string;
}

function iso(d: string | null | undefined): string {
  if (!d) return new Date().toISOString();
  return d;
}

function mapDbRowToRevisionVersion(row: Record<string, unknown>): RevisionVersion {
  return {
    id: String(row.id),
    round: Number(row.revision_number ?? 1),
    submittedAt: iso(row.submitted_at as string),
    authorNote: String(row.author_note ?? ""),
    responseLetter: (row.response_letter as string) ?? undefined,
    fileUrl: String(row.file_url ?? ""),
  };
}

export async function fetchRevisionVersionsBatch(
  manuscriptIds: string[]
): Promise<Map<string, RevisionVersion[]>> {
  const out = new Map<string, RevisionVersion[]>();
  if (manuscriptIds.length === 0) return out;

  const { data, error } = await supabase
    .from("manuscript_revision_versions")
    .select("id, manuscript_id, revision_number, file_url, author_note, response_letter, submitted_at")
    .in("manuscript_id", manuscriptIds)
    .order("revision_number", { ascending: true });

  if (error || !data?.length) {
    return out;
  }

  for (const raw of data) {
    const row = raw as Record<string, unknown>;
    const msId = String(row.manuscript_id ?? "");
    const list = out.get(msId) ?? [];
    list.push(mapDbRowToRevisionVersion(row));
    out.set(msId, list);
  }

  return out;
}

export async function fetchRevisionExtensionGrantsBatch(
  manuscriptIds: string[]
): Promise<Map<string, RevisionExtensionGrantRow[]>> {
  const out = new Map<string, RevisionExtensionGrantRow[]>();
  if (manuscriptIds.length === 0) return out;

  const { data, error } = await supabase
    .from("revision_extension_grants")
    .select("id, manuscript_id, reason, granted_at")
    .in("manuscript_id", manuscriptIds)
    .order("granted_at", { ascending: true });

  if (error || !data?.length) {
    return out;
  }

  for (const raw of data) {
    const row = raw as Record<string, unknown>;
    const msId = String(row.manuscript_id ?? "");
    const list = out.get(msId) ?? [];
    list.push({
      id: String(row.id),
      reason: String(row.reason ?? ""),
      grantedAt: iso(row.granted_at as string),
    });
    out.set(msId, list);
  }

  return out;
}

/**
 * Merge relational revision rows into `submission_metadata.revision_cycle` and extension grants.
 * When DB has at least one version, DB is source of truth for rounds; otherwise legacy JSON is kept.
 */
export async function mergeRevisionIntoManuscripts(manuscripts: Manuscript[]): Promise<Manuscript[]> {
  if (manuscripts.length === 0) return manuscripts;

  const ids = manuscripts.map((m) => m.id);
  const [versionMap, extensionMap] = await Promise.all([
    fetchRevisionVersionsBatch(ids),
    fetchRevisionExtensionGrantsBatch(ids),
  ]);

  return manuscripts.map((m) => {
    const fromDb = versionMap.get(m.id) ?? [];
    const legacy = m.submission_metadata?.revision_cycle;
    const legacyRounds = legacy?.rounds?.filter((r) => !r.extensionGranted) ?? [];

    let rounds: RevisionVersion[];
    if (fromDb.length > 0) {
      rounds = fromDb;
    } else {
      rounds = legacyRounds;
    }

    const extensionGrants = extensionMap.get(m.id) ?? [];

    const revision_cycle: NonNullable<SubmissionMetadata["revision_cycle"]> = {
      rounds,
      extensionPolicyDays: legacy?.extensionPolicyDays ?? 7,
    };

    const nextMeta: SubmissionMetadata = {
      ...(m.submission_metadata ?? {}),
      revision_cycle,
      revision_extension_grants: extensionGrants.length > 0 ? extensionGrants : undefined,
    };

    return {
      ...m,
      submission_metadata: nextMeta,
    };
  });
}

export async function getNextRevisionNumber(manuscriptId: string): Promise<number> {
  const { data, error } = await supabase
    .from("manuscript_revision_versions")
    .select("revision_number")
    .eq("manuscript_id", manuscriptId)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return 1;
  const n = data?.revision_number;
  return typeof n === "number" && n >= 1 ? n + 1 : 1;
}

export async function insertManuscriptRevisionVersion(
  manuscriptId: string,
  input: {
    fileUrl: string;
    authorNote: string;
    responseLetter?: string;
    submitterId?: string | null;
  }
): Promise<{ id: string | null; revisionNumber: number | null; error: Error | null }> {
  const revisionNumber = await getNextRevisionNumber(manuscriptId);
  const { data, error } = await supabase
    .from("manuscript_revision_versions")
    .insert({
      manuscript_id: manuscriptId,
      revision_number: revisionNumber,
      file_url: input.fileUrl,
      author_note: input.authorNote,
      response_letter: input.responseLetter ?? null,
      submitter_id: input.submitterId ?? null,
    })
    .select("id, revision_number")
    .single();

  if (error) {
    return { id: null, revisionNumber: null, error: new Error(error.message) };
  }
  const row = data as Record<string, unknown> | null;
  return {
    id: row ? String(row.id) : null,
    revisionNumber: row ? Number(row.revision_number) : revisionNumber,
    error: null,
  };
}

export async function insertRevisionExtensionGrant(
  manuscriptId: string,
  reason: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("revision_extension_grants").insert({
    manuscript_id: manuscriptId,
    reason,
  });
  if (error) return { error: new Error(error.message) };
  return { error: null };
}
