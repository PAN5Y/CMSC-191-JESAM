import type { Manuscript } from "@/types";
import type { JournalClassification } from "@/types";

/** Invite payload shape — matches [`ReviewerInvitePayload`](src/types.ts) pool rows. */
export type ReviewerCandidate = {
  reviewerEmail: string;
  reviewerName: string;
  expertise: JournalClassification;
};

export type RankedReviewerSuggestion = ReviewerCandidate & { matchScore: number };

/**
 * Fallback demo directory when DB has no reviewer-role users or fetch fails (local/dev).
 * Proposal §2.4: AI-assisted assignment — deterministic ranking, not external ML.
 */
export const REVIEWER_CANDIDATE_POOL: ReviewerCandidate[] = [
  { reviewerEmail: "reviewer.climate@jesam.org", reviewerName: "Dr. Climate Analysis", expertise: "Air" },
  { reviewerEmail: "reviewer.ecology@jesam.org", reviewerName: "Dr. Ecology Systems", expertise: "Land" },
  { reviewerEmail: "reviewer.hydrology@jesam.org", reviewerName: "Dr. Hydrology", expertise: "Water" },
  { reviewerEmail: "reviewer.social@jesam.org", reviewerName: "Dr. Social Ecology", expertise: "People" },
  { reviewerEmail: "reviewer.cross@jesam.org", reviewerName: "Dr. Cross-Disciplinary Env.", expertise: "Land" },
];

export function rankReviewersForManuscript(
  manuscript: Manuscript,
  invitedEmailsLower: Set<string>,
  pool: ReviewerCandidate[]
): RankedReviewerSuggestion[] {
  const cls = manuscript.classification;
  return pool
    .filter((r) => !invitedEmailsLower.has(r.reviewerEmail.toLowerCase()))
    .map((r) => ({
      ...r,
      /** Higher = better match to manuscript focus */
      matchScore: cls && r.expertise === cls ? 100 : 40,
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

export type ReviewerInvitePayload = {
  reviewerEmail: string;
  reviewerName: string;
  expertise: JournalClassification;
};

export function pickNextSuggestedReviewer(
  manuscript: Manuscript,
  invitations: { reviewerEmail: string }[],
  pool: ReviewerCandidate[]
): ReviewerInvitePayload | null {
  const invited = new Set(invitations.map((i) => i.reviewerEmail.toLowerCase()));
  const ranked = rankReviewersForManuscript(manuscript, invited, pool);
  const top = ranked[0];
  if (!top) return null;
  const { matchScore: _m, ...payload } = top;
  return payload;
}
