import type {
  Manuscript,
  NotificationEvent,
  PeerReviewRound,
  ReviewInvitation,
  ReviewSubmission,
  RevisionVersion,
  WorkflowAuditLog,
  ReviewerRecommendation,
} from '@/types';

/** CMSC 191 §2.4: minimum three (3) submitted reviews before recording an editorial decision per round. */
export const PEER_REVIEW_TARGET_COUNT = 3;

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function appendAudit(manuscript: Manuscript, actor: string, action: string, note?: string) {
  const prev = manuscript.submission_metadata ?? {};
  const logs = prev.audit_logs ?? [];
  const next: WorkflowAuditLog = {
    id: makeId('audit'),
    actor,
    action,
    note,
    createdAt: nowIso(),
  };
  return [...logs, next];
}

export function appendNotification(
  manuscript: Manuscript,
  payload: Omit<NotificationEvent, 'id' | 'createdAt' | 'delivered'>
) {
  const prev = manuscript.submission_metadata ?? {};
  const notifications = prev.notifications ?? [];
  const next: NotificationEvent = {
    id: makeId('notif'),
    createdAt: nowIso(),
    delivered: true,
    ...payload,
  };
  return [...notifications, next];
}

export function ensurePeerReviewRound(manuscript: Manuscript, targetReviewerCount = PEER_REVIEW_TARGET_COUNT) {
  const prev = manuscript.submission_metadata ?? {};
  const peerReview = prev.peer_review ?? { activeRound: 1, rounds: [] };
  const hasActive = peerReview.rounds.some((r) => r.round === (peerReview.activeRound ?? 1));
  if (hasActive) return peerReview;

  const newRound: PeerReviewRound = {
    round: peerReview.activeRound ?? 1,
    createdAt: nowIso(),
    targetReviewerCount,
    invitations: [],
    submissions: [],
  };
  return {
    ...peerReview,
    rounds: [...peerReview.rounds, newRound],
  };
}

export function inviteReviewer(
  manuscript: Manuscript,
  reviewer: { reviewerEmail: string; reviewerName: string; expertise: string },
  dueDays = 7
) {
  const peerReview = ensurePeerReviewRound(manuscript, PEER_REVIEW_TARGET_COUNT);
  const activeRound = peerReview.activeRound ?? 1;
  const invitation: ReviewInvitation = {
    id: makeId('inv'),
    reviewerEmail: reviewer.reviewerEmail,
    reviewerName: reviewer.reviewerName,
    expertise: reviewer.expertise,
    invitedAt: nowIso(),
    dueAt: addDaysIso(dueDays),
    status: 'invited',
  };
  return {
    ...peerReview,
    rounds: peerReview.rounds.map((round) =>
      round.round === activeRound
        ? { ...round, invitations: [...round.invitations, invitation] }
        : round
    ),
  };
}

export function setInvitationStatus(
  manuscript: Manuscript,
  invitationId: string,
  status: ReviewInvitation['status']
) {
  const prev = manuscript.submission_metadata?.peer_review;
  if (!prev) return prev;
  return {
    ...prev,
    rounds: prev.rounds.map((round) => ({
      ...round,
      invitations: round.invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, status } : inv
      ),
    })),
  };
}

export function submitReview(
  manuscript: Manuscript,
  input: {
    invitationId: string;
    reviewerEmail: string;
    summary: string;
    majorConcerns: string;
    minorConcerns: string;
    confidentialToEditor?: string;
    recommendation: ReviewerRecommendation;
  }
) {
  const prev = manuscript.submission_metadata?.peer_review;
  if (!prev) return prev;
  const submission: ReviewSubmission = {
    id: makeId('review'),
    submittedAt: nowIso(),
    ...input,
  };
  return {
    ...prev,
    rounds: prev.rounds.map((round) => {
      const hasInvitation = round.invitations.some((inv) => inv.id === input.invitationId);
      if (!hasInvitation) return round;
      return {
        ...round,
        submissions: [...round.submissions, submission],
        invitations: round.invitations.map((inv) =>
          inv.id === input.invitationId ? { ...inv, status: 'accepted' } : inv
        ),
      };
    }),
  };
}

export function upsertRevisionVersion(
  manuscript: Manuscript,
  input: {
    round: number;
    authorNote: string;
    responseLetter?: string;
    fileUrl?: string;
    extensionGranted?: boolean;
    extensionReason?: string;
  }
) {
  const prev = manuscript.submission_metadata ?? {};
  const revision = prev.revision_cycle ?? { rounds: [], extensionPolicyDays: 7 };
  const version: RevisionVersion = {
    id: makeId('rev'),
    submittedAt: nowIso(),
    ...input,
  };
  return {
    ...revision,
    rounds: [...revision.rounds, version],
  };
}
