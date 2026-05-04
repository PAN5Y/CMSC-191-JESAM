/**
 * Shared database-aligned types for JESAM (see README).
 * Single source of truth for manuscripts and workflow statuses.
 */

export type ManuscriptStatus =
  | "Pending Format Verification"
  | "Editor In Chief Screening"
  | "Peer Review"
  | "Revision Requested"
  | "Returned to Author"
  | "Rejected"
  | "Accepted"
  | "In Production"
  | "Published"
  | "Return to Revision"
  | "Retracted";

/** Statuses shown on Publication & Impact dashboard (post-acceptance pipeline). */
export const PUBLICATION_PIPELINE_STATUSES: ManuscriptStatus[] = [
  "Accepted",
  "In Production",
  "Published",
  "Return to Revision",
  "Retracted",
];

export type AppRole =
  | "author"
  | "reviewer"
  | "associate_editor"
  | "managing_editor"
  | "production_editor"
  | "editor_in_chief"
  | "system_admin";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  affiliation?: string;
  orcid_id?: string;
  role: AppRole;
  /** Populated for reviewers; optional SESAM focus for invite ranking */
  review_expertise?: string | null;
  created_at: string;
}

export type JournalClassification = "Land" | "Air" | "Water" | "People";

export interface ManuscriptMetrics {
  id?: string;
  manuscript_id?: string;
  views: number;
  downloads: number;
  citations: number;
  last_updated?: string;
}

/** Rich author line items stored inside submission_metadata (not duplicated on authors array). */
export interface SubmissionAuthorDetail {
  id: string;
  name: string;
  email: string;
  orcid?: string;
  affiliation: string;
  isCorresponding: boolean;
}

export interface AutomatedCheckSnapshot {
  formatting: { status: string; message: string };
  assets: { status: string; message: string };
  plagiarism: { status: string; message: string };
}

export type ReviewerRecommendation =
  | "accept"
  | "minor-revision"
  | "major-revision"
  | "reject";

export type ReviewInvitationStatus = "invited" | "accepted" | "declined" | "expired";

export interface ReviewInvitation {
  id: string;
  reviewerEmail: string;
  reviewerName: string;
  expertise: string;
  invitedAt: string;
  dueAt: string;
  status: ReviewInvitationStatus;
}

export interface ReviewSubmission {
  id: string;
  invitationId: string;
  reviewerEmail: string;
  summary: string;
  majorConcerns: string;
  minorConcerns: string;
  confidentialToEditor?: string;
  recommendation: ReviewerRecommendation;
  submittedAt: string;
}

export interface PeerReviewRound {
  round: number;
  createdAt: string;
  targetReviewerCount: number;
  invitations: ReviewInvitation[];
  submissions: ReviewSubmission[];
  editorDecision?: "accept" | "revise" | "reject" | "additional-reviewer";
  editorDecisionNote?: string;
  decidedAt?: string;
}

export interface RevisionVersion {
  id: string;
  round: number;
  submittedAt: string;
  authorNote: string;
  responseLetter?: string;
  fileUrl?: string;
  extensionGranted?: boolean;
  extensionReason?: string;
}

export interface NotificationEvent {
  id: string;
  type:
    | "submission-received"
    | "screening-decision"
    | "review-invitation"
    | "review-submitted"
    | "revision-requested"
    | "revision-submitted"
    | "accepted"
    | "published";
  recipientRole: AppRole | "public";
  recipientEmail?: string;
  message: string;
  createdAt: string;
  delivered: boolean;
}

export interface WorkflowAuditLog {
  id: string;
  actor: string;
  action: string;
  note?: string;
  createdAt: string;
}

export interface SubmissionMetadata {
  funding?: string;
  subjectArea?: string;
  competingInterests?: string;
  ethicalApprovals?: string;
  author_details?: SubmissionAuthorDetail[];
  automated_checks?: AutomatedCheckSnapshot;
  similarity_score?: number;
  declarations?: {
    noCompetingInterests?: boolean;
    ethicalStandards?: boolean;
    dataAvailability?: boolean;
    authorshipContribution?: boolean;
  };
  screening_comments?: string;
  rejection_reason?: string;
  screening_decided_at?: string;
  screening_decided_by?: string;
  editor_verification_comments?: string;
  peer_review?: {
    activeRound?: number;
    rounds: PeerReviewRound[];
  };
  revision_cycle?: {
    rounds: RevisionVersion[];
    extensionPolicyDays?: number;
  };
  /** Relational `revision_extension_grants` merged for editors/authors (not author file uploads). */
  revision_extension_grants?: Array<{
    id: string;
    reason: string;
    grantedAt: string;
  }>;
  notifications?: NotificationEvent[];
  audit_logs?: WorkflowAuditLog[];
  ai_summary?: {
    short?: string;
    keywords?: string[];
    generatedAt?: string;
  };
}

export interface Manuscript {
  id: string;
  submitter_id?: string | null;
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  status: ManuscriptStatus;
  classification: JournalClassification | null;
  doi?: string | null;
  file_url?: string | null;
  issue_assignment?: string | null;
  created_at: string;
  published_at?: string | null;
  reference_code?: string | null;
  /** Active peer-review round; relational store mirrors former submission_metadata.peer_review.activeRound */
  peer_review_active_round?: number | null;
  submission_metadata?: SubmissionMetadata | null;
  metrics?: ManuscriptMetrics | null;
}

export interface ReadinessStatus {
  metadataComplete: boolean;
  filesReady: boolean;
  doiAssigned: boolean;
  isReady: boolean;
}

export function parseAuthors(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((a) => {
      if (typeof a === "string") return a;
      if (a && typeof a === "object" && "name" in a) return String((a as { name: unknown }).name);
      return String(a);
    });
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    if (s.startsWith("[")) {
      try {
        const p = JSON.parse(s) as unknown;
        return parseAuthors(p);
      } catch {
        return [s];
      }
    }
    return [s];
  }
  return [];
}

export function parseKeywords(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    if (s.startsWith("[")) {
      try {
        const p = JSON.parse(s) as unknown;
        return parseKeywords(p);
      } catch {
        return s.split(",").map((k) => k.trim()).filter(Boolean);
      }
    }
    return s.split(",").map((k) => k.trim()).filter(Boolean);
  }
  return [];
}

export function parseSubmissionMetadata(value: unknown): SubmissionMetadata | null {
  if (value == null || value === "") return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as SubmissionMetadata;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as SubmissionMetadata;
    } catch {
      return null;
    }
  }
  return null;
}

const CLASSIFICATIONS: JournalClassification[] = ["Land", "Air", "Water", "People"];

export function parseClassification(value: unknown): JournalClassification | null {
  if (value == null || value === "") return null;
  const s = String(value);
  return CLASSIFICATIONS.includes(s as JournalClassification)
    ? (s as JournalClassification)
    : null;
}

/** Normalize a row from PostgREST / Supabase into Manuscript. */
export function normalizeManuscriptRow(row: Record<string, unknown>): Manuscript {
  const metricsRaw = row.metrics;
  let metrics: ManuscriptMetrics | null = null;
  if (Array.isArray(metricsRaw) && metricsRaw[0]) {
    metrics = metricsRaw[0] as ManuscriptMetrics;
  } else if (metricsRaw && typeof metricsRaw === "object" && !Array.isArray(metricsRaw)) {
    metrics = metricsRaw as ManuscriptMetrics;
  }

  return {
    id: String(row.id),
    submitter_id: (row.submitter_id as string) ?? null,
    title: String(row.title ?? ""),
    abstract: String(row.abstract ?? ""),
    authors: parseAuthors(row.authors),
    keywords: parseKeywords(row.keywords),
    status: row.status as ManuscriptStatus,
    classification: parseClassification(row.classification),
    doi: (row.doi as string) ?? null,
    file_url: (row.file_url as string) ?? null,
    issue_assignment: (row.issue_assignment as string) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    published_at: (row.published_at as string) ?? null,
    reference_code: (row.reference_code as string) ?? null,
    peer_review_active_round:
      row.peer_review_active_round == null || row.peer_review_active_round === ""
        ? null
        : Number(row.peer_review_active_round),
    submission_metadata: parseSubmissionMetadata(row.submission_metadata),
    metrics,
  };
}
