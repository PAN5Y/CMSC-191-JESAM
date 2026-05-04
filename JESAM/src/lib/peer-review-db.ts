import { supabase } from "@/lib/supabase";
import { normalizeManuscriptRow } from "@/types";
import type {
  Manuscript,
  PeerReviewRound,
  ReviewInvitation,
  ReviewInvitationStatus,
  ReviewSubmission,
  ReviewerRecommendation,
} from "@/types";
import { PEER_REVIEW_TARGET_COUNT } from "@/lib/workflow";

export interface PeerReviewStateJson {
  activeRound: number;
  rounds: PeerReviewRound[];
}

function iso(d: string | null | undefined): string {
  if (!d) return new Date().toISOString();
  return d;
}

function mapInvitationStatus(s: string): ReviewInvitationStatus {
  if (s === "accepted" || s === "declined" || s === "expired" || s === "invited") return s;
  return "invited";
}

function mapRecommendation(s: string): ReviewerRecommendation {
  if (
    s === "accept" ||
    s === "minor-revision" ||
    s === "major-revision" ||
    s === "reject"
  ) {
    return s;
  }
  return "major-revision";
}

function mapSubmissionRow(
  row: Record<string, unknown>,
  invitationId: string,
  reviewerEmail: string
): ReviewSubmission {
  return {
    id: String(row.id),
    invitationId,
    reviewerEmail,
    summary: String(row.summary ?? ""),
    majorConcerns: String(row.major_concerns ?? ""),
    minorConcerns: String(row.minor_concerns ?? ""),
    confidentialToEditor: (row.confidential_to_editor as string) ?? undefined,
    recommendation: mapRecommendation(String(row.recommendation ?? "")),
    submittedAt: iso(row.submitted_at as string),
  };
}

function mapInvitationRow(row: Record<string, unknown>): ReviewInvitation {
  const id = String(row.id);
  const email = String(row.reviewer_email ?? "");
  const due =
    (row.due_at as string) ??
    (() => {
      const t = new Date(String(row.invited_at ?? Date.now()));
      t.setDate(t.getDate() + 7);
      return t.toISOString();
    })();
  return {
    id,
    reviewerEmail: email,
    reviewerName: String(row.reviewer_name ?? ""),
    expertise: String(row.expertise ?? ""),
    invitedAt: iso(row.invited_at as string),
    dueAt: due,
    status: mapInvitationStatus(String(row.status ?? "invited")),
  };
}

function mapRoundFromDbRow(row: Record<string, unknown>): PeerReviewRound {
  const invRaw = row.reviewer_invitations;
  const invitationsNested = Array.isArray(invRaw) ? invRaw : [];

  const invitationList: ReviewInvitation[] = [];
  const roundSubmissions: ReviewSubmission[] = [];

  for (const ir of invitationsNested) {
    const inv = ir as Record<string, unknown>;
    const invId = String(inv.id);
    const reviewerEmail = String(inv.reviewer_email ?? "");
    const subsRaw = inv.review_submissions;
    const subsArr = Array.isArray(subsRaw) ? subsRaw : [];
    const subs: ReviewSubmission[] = subsArr.map((s) =>
      mapSubmissionRow(s as Record<string, unknown>, invId, reviewerEmail)
    );
    roundSubmissions.push(...subs);
    invitationList.push(mapInvitationRow(inv));
  }

  const editorDecision = row.editor_decision as string | null | undefined;
  const decision =
    editorDecision === "accept" ||
    editorDecision === "revise" ||
    editorDecision === "reject" ||
    editorDecision === "additional-reviewer"
      ? editorDecision
      : undefined;

  const roundNum = Number(row.round_number ?? 1);
  const rawTarget = Number(row.target_reviewer_count ?? PEER_REVIEW_TARGET_COUNT);
  const normalizedTarget =
    Number.isFinite(rawTarget) && rawTarget > 0 ? rawTarget : PEER_REVIEW_TARGET_COUNT;

  return {
    round: roundNum,
    createdAt: iso(row.created_at as string),
    /** Never exceed app policy; legacy rows with 3 normalize to current PEER_REVIEW_TARGET_COUNT. */
    targetReviewerCount: Math.min(normalizedTarget, PEER_REVIEW_TARGET_COUNT),
    invitations: invitationList,
    submissions: roundSubmissions,
    editorDecision: decision,
    editorDecisionNote: (row.editor_decision_note as string) ?? undefined,
    decidedAt: row.decided_at ? iso(row.decided_at as string) : undefined,
  };
}

export async function fetchPeerReviewState(
  manuscriptId: string,
  activeRoundOverride?: number | null
): Promise<PeerReviewStateJson | null> {
  const activeMap = new Map<string, number | null | undefined>();
  activeMap.set(manuscriptId, activeRoundOverride);
  const batch = await fetchPeerReviewStatesBatch([manuscriptId], activeMap);
  return batch.get(manuscriptId) ?? null;
}

/**
 * Load relational peer review for many manuscripts in few queries.
 * `activeRoundByManuscriptId` optional map from manuscript row (peer_review_active_round).
 */
export async function fetchPeerReviewStatesBatch(
  manuscriptIds: string[],
  activeRoundByManuscript?: Map<string, number | null | undefined>
): Promise<Map<string, PeerReviewStateJson>> {
  const out = new Map<string, PeerReviewStateJson>();
  if (manuscriptIds.length === 0) return out;

  const { data: rounds, error: rErr } = await supabase
    .from("peer_review_rounds")
    .select(
      `
      id,
      manuscript_id,
      round_number,
      target_reviewer_count,
      editor_decision,
      editor_decision_note,
      created_at,
      decided_at,
      reviewer_invitations (
        id,
        peer_review_round_id,
        reviewer_email,
        reviewer_name,
        expertise,
        status,
        invited_at,
        due_at,
        review_submissions (
          id,
          invitation_id,
          recommendation,
          summary,
          major_concerns,
          minor_concerns,
          confidential_to_editor,
          submitted_at
        )
      )
    `
    )
    .in("manuscript_id", manuscriptIds);

  if (rErr || !rounds?.length) {
    return out;
  }

  const byMs = new Map<string, Record<string, unknown>[]>();
  for (const raw of rounds) {
    const row = raw as Record<string, unknown>;
    const msId = String(row.manuscript_id ?? "");
    const list = byMs.get(msId) ?? [];
    list.push(row);
    byMs.set(msId, list);
  }

  for (const [msId, roundRows] of byMs) {
    const peerRounds = roundRows.map((row) => mapRoundFromDbRow(row));
    peerRounds.sort((a, b) => a.round - b.round);

    const colRound = activeRoundByManuscript?.get(msId);
    let activeRound: number;
    if (typeof colRound === "number") {
      activeRound = colRound;
    } else if (peerRounds.length) {
      activeRound = peerRounds[peerRounds.length - 1].round;
    } else {
      activeRound = 1;
    }

    out.set(msId, { activeRound, rounds: peerRounds });
  }

  return out;
}

/** True if at least one `peer_review_rounds` row exists for this manuscript (relational store). */
export async function manuscriptHasPeerReviewRoundsInDb(
  manuscriptId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("peer_review_rounds")
    .select("id")
    .eq("manuscript_id", manuscriptId)
    .limit(1);

  if (error || !data?.length) return false;
  return true;
}

/** Fix active rounds using manuscript column when batch map not passed — second pass */
export async function mergePeerReviewIntoManuscripts(
  manuscripts: Manuscript[]
): Promise<Manuscript[]> {
  if (manuscripts.length === 0) return manuscripts;

  const ids = manuscripts.map((m) => m.id);
  const activeMap = new Map<string, number | null | undefined>();
  for (const m of manuscripts) {
    activeMap.set(m.id, m.peer_review_active_round);
  }

  const bundles = await fetchPeerReviewStatesBatch(ids, activeMap);

  return manuscripts.map((m) => {
    const fromDb = bundles.get(m.id);
    const legacy = m.submission_metadata?.peer_review;

    const hasUsefulDbState =
      fromDb &&
      fromDb.rounds.some(
        (r) =>
          r.invitations.length > 0 ||
          r.submissions.length > 0 ||
          r.editorDecision != null ||
          (r.editorDecisionNote != null && r.editorDecisionNote !== "")
      );

    let peerReview: PeerReviewStateJson | undefined;
    if (hasUsefulDbState && fromDb) {
      peerReview = fromDb;
    } else if (legacy) {
      peerReview = {
        activeRound: legacy.activeRound ?? 1,
        rounds: legacy.rounds ?? [],
      };
    } else if (fromDb && fromDb.rounds.length > 0) {
      peerReview = fromDb;
    }

    if (peerReview) {
      const mergedActive =
        m.peer_review_active_round ??
        legacy?.activeRound ??
        peerReview.activeRound ??
        1;
      peerReview = { ...peerReview, activeRound: mergedActive };
    }

    if (!peerReview) return m;

    const nextMeta = {
      ...(m.submission_metadata ?? {}),
      peer_review: peerReview,
    };

    return {
      ...m,
      submission_metadata: nextMeta,
    };
  });
}

export async function createPeerReviewRound(
  manuscriptId: string,
  roundNumber: number,
  targetCount = PEER_REVIEW_TARGET_COUNT
): Promise<{ id: string | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("peer_review_rounds")
    .insert({
      manuscript_id: manuscriptId,
      round_number: roundNumber,
      target_reviewer_count: targetCount,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: new Error(error.message) };
  return { id: data?.id as string, error: null };
}

export async function upsertPeerReviewRound(
  manuscriptId: string,
  roundNumber: number,
  targetCount = PEER_REVIEW_TARGET_COUNT
): Promise<{ id: string | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("peer_review_rounds")
    .upsert(
      {
        manuscript_id: manuscriptId,
        round_number: roundNumber,
        target_reviewer_count: targetCount,
      },
      { onConflict: "manuscript_id,round_number" }
    )
    .select("id")
    .single();

  if (error) return { id: null, error: new Error(error.message) };
  return { id: data?.id as string, error: null };
}

export async function setManuscriptActiveRound(
  manuscriptId: string,
  roundNumber: number | null
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("manuscripts")
    .update({ peer_review_active_round: roundNumber })
    .eq("id", manuscriptId);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export async function peerReviewRoundRowExists(
  manuscriptId: string,
  roundNumber: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from("peer_review_rounds")
    .select("id")
    .eq("manuscript_id", manuscriptId)
    .eq("round_number", roundNumber)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function getRoundRowId(
  manuscriptId: string,
  roundNumber: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from("peer_review_rounds")
    .select("id")
    .eq("manuscript_id", manuscriptId)
    .eq("round_number", roundNumber)
    .maybeSingle();

  if (error || !data) return null;
  return data.id as string;
}

export async function insertInvitation(
  roundId: string,
  payload: {
    reviewerEmail: string;
    reviewerName: string;
    expertise: string;
    dueDays?: number;
  }
): Promise<{ id: string | null; error: Error | null }> {
  const due = new Date();
  due.setDate(due.getDate() + (payload.dueDays ?? 7));

  const { data, error } = await supabase
    .from("reviewer_invitations")
    .insert({
      peer_review_round_id: roundId,
      reviewer_email: payload.reviewerEmail.trim().toLowerCase(),
      reviewer_name: payload.reviewerName.trim(),
      expertise: payload.expertise.trim(),
      status: "invited",
      due_at: due.toISOString(),
    })
    .select("id")
    .single();

  if (error) return { id: null, error: new Error(error.message) };
  return { id: data?.id as string, error: null };
}

export async function updateInvitationStatus(
  invitationId: string,
  status: ReviewInvitationStatus
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("reviewer_invitations")
    .update({ status })
    .eq("id", invitationId);

  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export async function insertReviewSubmission(
  invitationId: string,
  fields: {
    reviewerEmail: string;
    summary: string;
    majorConcerns: string;
    minorConcerns: string;
    confidentialToEditor?: string;
    recommendation: ReviewerRecommendation;
  }
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("review_submissions").insert({
    invitation_id: invitationId,
    recommendation: fields.recommendation,
    summary: fields.summary,
    major_concerns: fields.majorConcerns,
    minor_concerns: fields.minorConcerns,
    confidential_to_editor: fields.confidentialToEditor ?? null,
  });

  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export async function updateRoundEditorDecision(
  manuscriptId: string,
  roundNumber: number,
  decision: "accept" | "revise" | "reject" | "additional-reviewer",
  note: string
): Promise<{ error: Error | null }> {
  const decidedAt = new Date().toISOString();
  const { error } = await supabase
    .from("peer_review_rounds")
    .update({
      editor_decision: decision,
      editor_decision_note: note,
      decided_at: decidedAt,
    })
    .eq("manuscript_id", manuscriptId)
    .eq("round_number", roundNumber);

  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export interface ReviewerAssignmentRow {
  manuscript: Manuscript;
  invitation: ReviewInvitation;
}

export interface ReviewerCompletedReviewRow {
  manuscript: Manuscript;
  invitation: ReviewInvitation;
  submission: ReviewSubmission;
}

/**
 * Submitted reviews for this reviewer (relational `review_submissions`), newest first.
 */
export async function fetchReviewerCompletedReviewsFromDb(
  email: string
): Promise<{ data: ReviewerCompletedReviewRow[]; error: Error | null }> {
  const em = email.trim().toLowerCase();
  if (!em) return { data: [], error: null };

  const { data, error } = await supabase
    .from("review_submissions")
    .select(
      `
      id,
      invitation_id,
      recommendation,
      summary,
      major_concerns,
      minor_concerns,
      confidential_to_editor,
      submitted_at,
      reviewer_invitations!inner (
        id,
        reviewer_email,
        reviewer_name,
        expertise,
        status,
        invited_at,
        due_at,
        peer_review_rounds!inner (
          round_number,
          manuscripts (*)
        )
      )
    `
    )
    .order("submitted_at", { ascending: false });

  if (error) return { data: [], error: new Error(error.message) };

  const rows: ReviewerCompletedReviewRow[] = [];

  for (const raw of data ?? []) {
    const sub = raw as Record<string, unknown>;
    const invNested = sub.reviewer_invitations as Record<string, unknown> | undefined;
    if (!invNested) continue;
    const invEmail = String(invNested.reviewer_email ?? "").trim().toLowerCase();
    if (invEmail !== em) continue;

    const pr = invNested.peer_review_rounds as Record<string, unknown> | undefined;
    const msNested = pr?.manuscripts as Record<string, unknown> | Record<string, unknown>[] | undefined;
    const msRow = Array.isArray(msNested) ? msNested[0] : msNested;
    if (!msRow) continue;

    const r = { ...msRow } as Record<string, unknown>;
    const m = r.metrics;
    if (Array.isArray(m) && m[0]) r.metrics = m[0];

    const manuscript = normalizeManuscriptRow(r);
    const invitation = mapInvitationRow(invNested);
    const invitationId = String(invNested.id ?? sub.invitation_id ?? "");
    const submission = mapSubmissionRow(sub, invitationId, invEmail);

    rows.push({ manuscript, invitation, submission });
  }

  return { data: rows, error: null };
}

/**
 * Invitations for a reviewer email from relational tables (Peer Review / Revision Requested manuscripts).
 */
export async function fetchReviewerAssignmentsFromDb(
  email: string
): Promise<{ data: ReviewerAssignmentRow[]; error: Error | null }> {
  const em = email.trim().toLowerCase();
  if (!em) return { data: [], error: null };

  const { data, error } = await supabase
    .from("reviewer_invitations")
    .select(
      `
      id,
      reviewer_email,
      reviewer_name,
      expertise,
      status,
      invited_at,
      due_at,
      peer_review_rounds!inner (
        id,
        round_number,
        manuscript_id,
        manuscripts!inner (*)
      )
    `
    )
    .ilike("reviewer_email", em);

  if (error) return { data: [], error: new Error(error.message) };

  const statuses = new Set(["Peer Review", "Revision Requested"]);
  const rows: ReviewerAssignmentRow[] = [];

  for (const raw of data ?? []) {
    const inv = raw as Record<string, unknown>;
    const pr = inv.peer_review_rounds as Record<string, unknown> | undefined;
    const msNested = pr?.manuscripts as Record<string, unknown> | Record<string, unknown>[] | undefined;
    const msRow = Array.isArray(msNested) ? msNested[0] : msNested;
    if (!msRow) continue;

    const r = { ...msRow } as Record<string, unknown>;
    const m = r.metrics;
    if (Array.isArray(m) && m[0]) r.metrics = m[0];

    const manuscript = normalizeManuscriptRow(r);
    if (!statuses.has(manuscript.status)) continue;

    const invitation = mapInvitationRow(inv);

    rows.push({ manuscript, invitation });
  }

  return { data: rows, error: null };
}

/** Legacy JSON invitations not yet migrated */
export function legacyReviewerAssignments(
  manuscripts: Manuscript[],
  email: string
): ReviewerAssignmentRow[] {
  const em = email.toLowerCase();
  const out: ReviewerAssignmentRow[] = [];
  for (const m of manuscripts) {
    const pr = m.submission_metadata?.peer_review;
    if (!pr) continue;
    const activeRound = pr.activeRound ?? 1;
    const round = pr.rounds.find((r) => r.round === activeRound);
    const invitation = round?.invitations.find((inv) => inv.reviewerEmail.toLowerCase() === em);
    if (invitation) out.push({ manuscript: m, invitation });
  }
  return out;
}

/**
 * SQL-backed assignments first; fill gaps from legacy metadata on the same manuscript list.
 */
export function combineReviewerAssignments(
  dbRows: ReviewerAssignmentRow[],
  legacyRows: ReviewerAssignmentRow[]
): ReviewerAssignmentRow[] {
  const seen = new Set<string>();
  const merged: ReviewerAssignmentRow[] = [];
  for (const row of dbRows) {
    const key = `${row.manuscript.id}:${row.invitation.id}`;
    seen.add(key);
    merged.push(row);
  }
  for (const row of legacyRows) {
    const key = `${row.manuscript.id}:${row.invitation.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return merged;
}
