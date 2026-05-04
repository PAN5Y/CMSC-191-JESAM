import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ChevronDown, ChevronRight, Users, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePeerReview } from '../hooks/usePeerReview';
import ManuscriptPdfViewer from '@/components/common/ManuscriptPdfViewer';
import type { Manuscript, ReviewerRecommendation } from '@/types';
import {
  fetchReviewerAssignmentsFromDb,
  fetchReviewerCompletedReviewsFromDb,
  legacyReviewerAssignments,
  combineReviewerAssignments,
  mergePeerReviewIntoManuscripts,
  type ReviewerAssignmentRow,
  type ReviewerCompletedReviewRow,
} from '@/lib/peer-review-db';
import {
  openReviewerCertificatePrint,
  reviewerDisplayNameFromUser,
} from '@/lib/reviewer-certificate';

type ActionLoading = 'accept' | 'decline' | 'submit' | null;

function recommendationLabel(r: ReviewerRecommendation): string {
  switch (r) {
    case 'accept':
      return 'Accept';
    case 'minor-revision':
      return 'Minor revision';
    case 'major-revision':
      return 'Major revision';
    case 'reject':
      return 'Reject';
    default:
      return r;
  }
}

function classificationBadgeClass(classification: string): string {
  switch (classification) {
    case 'Land':
      return 'bg-amber-100 text-amber-800';
    case 'Air':
      return 'bg-cyan-100 text-cyan-800';
    case 'Water':
      return 'bg-blue-100 text-blue-800';
    case 'People':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function similarityPercent(m: Manuscript): number {
  const s = m.submission_metadata?.similarity_score;
  if (typeof s === 'number' && !Number.isNaN(s)) return s;
  return 0;
}

function formattingPassed(m: Manuscript): boolean {
  const st = m.submission_metadata?.automated_checks?.formatting?.status;
  return st === 'passed';
}

function similarityBarColor(similarity: number): string {
  if (similarity <= 15) return 'bg-green-500';
  if (similarity <= 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

function ReviewerManuscriptMaterials({ manuscript }: { manuscript: Manuscript }) {
  const refLabel = manuscript.reference_code ?? manuscript.id.slice(0, 8).toUpperCase();
  const meta = manuscript.submission_metadata;
  const cls = manuscript.classification;
  const sim = similarityPercent(manuscript);
  const authorsDisplay = manuscript.authors?.length ? manuscript.authors.join(', ') : '—';

  return (
    <section
      className="space-y-4 border border-gray-200 rounded-lg p-4 bg-slate-50/50"
      aria-label="Manuscript for review"
    >
      <h3 className="text-sm font-semibold text-gray-900">Manuscript for review</h3>
      <ManuscriptPdfViewer
        fileUrl={manuscript.file_url}
        title={`${manuscript.title} — manuscript PDF`}
        className="w-full"
      />
      <div className="flex flex-wrap gap-3 items-start justify-between gap-y-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Reference</p>
          <p className="font-mono text-sm text-gray-900">{refLabel}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">{manuscript.id}</p>
        </div>
        {cls ? (
          <span
            className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${classificationBadgeClass(cls)}`}
          >
            {cls}
          </span>
        ) : (
          <span className="text-xs text-gray-400 shrink-0">No classification</span>
        )}
      </div>

      <div className="flex items-start gap-2">
        <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 mb-0.5">Authors</p>
          <p className="text-sm text-gray-800">{authorsDisplay}</p>
        </div>
      </div>

      {manuscript.keywords && manuscript.keywords.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Keywords</p>
          <p className="text-sm text-gray-800">{manuscript.keywords.join(', ')}</p>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Abstract</p>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {manuscript.abstract?.trim() ? manuscript.abstract : '—'}
        </p>
      </div>

      {meta?.subjectArea?.trim() ? (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Subject area</p>
          <p className="text-sm text-gray-800">{meta.subjectArea}</p>
        </div>
      ) : null}
      {meta?.funding?.trim() ? (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Funding</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{meta.funding}</p>
        </div>
      ) : null}
      {meta?.ethicalApprovals?.trim() ? (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Ethical approvals</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{meta.ethicalApprovals}</p>
        </div>
      ) : null}
      {meta?.competingInterests?.trim() ? (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Competing interests (authors)</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{meta.competingInterests}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
        <div>
          <p className="text-xs font-semibold text-gray-900 mb-2">Similarity score</p>
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${similarityBarColor(sim)}`}
                style={{ width: `${Math.min(sim, 100)}%` }}
              />
            </div>
            <p className="text-lg font-bold text-gray-900">{sim}%</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 mb-2">Formatting (automated)</p>
          <div className="flex items-center gap-2">
            {formattingPassed(manuscript) ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" aria-hidden />
                <span className="text-sm font-medium text-green-700">Passed</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-amber-600 shrink-0" aria-hidden />
                <span className="text-sm font-medium text-amber-700">Pending or not passed</span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ReviewerPortal() {
  const { user } = useAuth();
  const { manuscripts, respondInvitation, submitReviewerFeedback, fetchManuscripts } =
    usePeerReview();
  const [selectedManuscriptId, setSelectedManuscriptId] = useState('');
  const [selectedInvitationId, setSelectedInvitationId] = useState('');
  const [summary, setSummary] = useState('');
  const [majorConcerns, setMajorConcerns] = useState('');
  const [minorConcerns, setMinorConcerns] = useState('');
  const [confidential, setConfidential] = useState('');
  const [recommendation, setRecommendation] = useState<ReviewerRecommendation>('major-revision');
  const [assignments, setAssignments] = useState<ReviewerAssignmentRow[]>([]);
  const [completedReviews, setCompletedReviews] = useState<ReviewerCompletedReviewRow[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  const [actionLoading, setActionLoading] = useState<ActionLoading>(null);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  const myEmail = (user?.email ?? '').toLowerCase();

  /** Fresh manuscripts for legacy merge without listing `manuscripts` in loadAssignments deps (avoids refetch loop when parent refetches). */
  const manuscriptsRef = useRef(manuscripts);
  manuscriptsRef.current = manuscripts;

  const loadCompletedReviews = useCallback(async () => {
    if (!myEmail) {
      setCompletedReviews([]);
      setLoadingCompleted(false);
      return;
    }
    setLoadingCompleted(true);
    try {
      const { data, error } = await fetchReviewerCompletedReviewsFromDb(myEmail);
      if (error) {
        setCompletedReviews([]);
        return;
      }
      setCompletedReviews(data);
    } finally {
      setLoadingCompleted(false);
    }
  }, [myEmail]);

  const loadAssignments = useCallback(
    async (options?: { showLoading?: boolean }) => {
      const showLoading = options?.showLoading ?? true;
      if (!myEmail) {
        setAssignments([]);
        setLoadingAssignments(false);
        return;
      }
      if (showLoading) setLoadingAssignments(true);
      const ms = manuscriptsRef.current;
      try {
        const { data: dbRows, error } = await fetchReviewerAssignmentsFromDb(myEmail);
        if (error) {
          toast.warning(
            'Could not load invitations from the server. Showing any matches from your session.'
          );
          setAssignments(legacyReviewerAssignments(ms, myEmail));
          return;
        }
        const mergedDb = await mergePeerReviewIntoManuscripts(dbRows.map((r) => r.manuscript));
        const dbEnriched: ReviewerAssignmentRow[] = dbRows.map((r, i) => ({
          manuscript: mergedDb[i] ?? r.manuscript,
          invitation: r.invitation,
        }));
        const legacy = legacyReviewerAssignments(ms, myEmail);
        setAssignments(combineReviewerAssignments(dbEnriched, legacy));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load invitations.');
        setAssignments(legacyReviewerAssignments(ms, myEmail));
      } finally {
        if (showLoading) setLoadingAssignments(false);
      }
    },
    [myEmail]
  );

  useEffect(() => {
    void loadAssignments({ showLoading: true });
    void loadCompletedReviews();
  }, [myEmail, loadAssignments, loadCompletedReviews]);

  const selected =
    assignments.find(
      (a) => a.manuscript.id === selectedManuscriptId && a.invitation.id === selectedInvitationId
    ) ??
    assignments.find((a) => a.manuscript.id === selectedManuscriptId) ??
    assignments[0];

  const submissionForSelected = completedReviews.find(
    (c) => c.invitation.id === selected?.invitation.id
  );

  useEffect(() => {
    if (assignments.length === 0) return;
    const stillValid = assignments.some(
      (a) => a.manuscript.id === selectedManuscriptId && a.invitation.id === selectedInvitationId
    );
    if (!stillValid) {
      const first = assignments[0];
      setSelectedManuscriptId(first.manuscript.id);
      setSelectedInvitationId(first.invitation.id);
    }
  }, [assignments, selectedManuscriptId, selectedInvitationId]);

  const chosenInvitationId = selectedInvitationId || selected?.invitation.id || '';

  const canSubmit =
    !submissionForSelected &&
    summary.trim().length > 0 &&
    majorConcerns.trim().length > 0 &&
    minorConcerns.trim().length > 0 &&
    chosenInvitationId.length > 0 &&
    selected?.invitation.status === 'accepted';

  const busy = actionLoading !== null;

  const handleAccept = async () => {
    if (!selected) {
      toast.error('Select an invitation first.');
      return;
    }
    if (selected.invitation.status === 'accepted') {
      toast.message('This invitation is already accepted.');
      return;
    }
    setActionLoading('accept');
    try {
      const ok = await respondInvitation(selected.manuscript, selected.invitation.id, 'accepted');
      if (ok) {
        toast.success('You accepted the review invitation.');
        await fetchManuscripts();
        await loadAssignments({ showLoading: false });
        await loadCompletedReviews();
      } else {
        toast.error('Could not accept the invitation. Try again or contact support.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!selected) {
      toast.error('Select an invitation first.');
      return;
    }
    if (selected.invitation.status === 'declined') {
      toast.message('This invitation was already declined.');
      return;
    }
    setActionLoading('decline');
    try {
      const ok = await respondInvitation(selected.manuscript, selected.invitation.id, 'declined');
      if (ok) {
        toast.success('You declined the review invitation.');
        await fetchManuscripts();
        await loadAssignments({ showLoading: false });
        await loadCompletedReviews();
      } else {
        toast.error('Could not decline the invitation. Try again or contact support.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!selected || !canSubmit) {
      if (!selected) toast.error('Select an invitation first.');
      else if (submissionForSelected)
        toast.message('You already submitted a review for this invitation.');
      else if (selected.invitation.status !== 'accepted')
        toast.error('Accept the invitation before submitting your review.');
      else toast.error('Fill in summary, major concerns, and minor concerns.');
      return;
    }
    setActionLoading('submit');
    try {
      const ok = await submitReviewerFeedback(selected.manuscript, {
        invitationId: chosenInvitationId,
        reviewerEmail: myEmail,
        summary,
        majorConcerns,
        minorConcerns,
        confidentialToEditor: confidential || undefined,
        recommendation,
      });
      if (ok) {
        toast.success('Review submitted. Thank you.');
        const ref =
          selected.manuscript.reference_code ?? selected.manuscript.id.slice(0, 8).toUpperCase();
        openReviewerCertificatePrint({
          reviewerName: reviewerDisplayNameFromUser(user),
          reviewerEmail: myEmail,
          manuscriptReference: ref,
          manuscriptTitle: selected.manuscript.title,
          completedAtIso: new Date().toISOString(),
        });
        setSummary('');
        setMajorConcerns('');
        setMinorConcerns('');
        setConfidential('');
        await fetchManuscripts();
        await loadAssignments({ showLoading: false });
        await loadCompletedReviews();
      } else {
        toast.error('Could not submit your review. Check your connection and try again.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const ReviewDetailReadOnly = ({ row }: { row: ReviewerCompletedReviewRow }) => (
    <div className="space-y-3 text-sm border border-gray-200 rounded-lg p-4 bg-gray-50/80">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <span className="font-medium text-gray-900">
          Recommendation:{' '}
          <span className="text-blue-800">
            {recommendationLabel(row.submission.recommendation)}
          </span>
        </span>
        <span className="text-xs text-gray-500">
          Submitted {new Date(row.submission.submittedAt).toLocaleString()}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary</p>
        <p className="text-gray-800 whitespace-pre-wrap">{row.submission.summary}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Major concerns
        </p>
        <p className="text-gray-800 whitespace-pre-wrap">{row.submission.majorConcerns}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Minor concerns
        </p>
        <p className="text-gray-800 whitespace-pre-wrap">{row.submission.minorConcerns}</p>
      </div>
      {row.submission.confidentialToEditor?.trim() ? (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Confidential to editor
          </p>
          <p className="text-gray-800 whitespace-pre-wrap">{row.submission.confidentialToEditor}</p>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Reviewer Portal</h1>
          <p className="text-gray-600 mt-1">
            Respond to invitations and submit structured peer reviews.
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">My invitations</h3>
            <div className="space-y-2 min-h-[4rem]">
              {loadingAssignments && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                  Loading invitations…
                </div>
              )}
              {!loadingAssignments &&
                assignments.map(({ manuscript, invitation }) => (
                  <button
                    key={invitation.id}
                    type="button"
                    onClick={() => {
                      setSelectedManuscriptId(manuscript.id);
                      setSelectedInvitationId(invitation.id);
                    }}
                    disabled={busy}
                    className={`w-full text-left border rounded p-3 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${selected?.invitation.id === invitation.id
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {manuscript.reference_code ?? manuscript.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-600">{invitation.status.toUpperCase()}</p>
                  </button>
                ))}
              {!loadingAssignments && assignments.length === 0 && (
                <p className="text-sm text-gray-500">No invitations assigned.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2 space-y-4">
            {!selected && !loadingAssignments ? (
              <p className="text-sm text-gray-500">Select an invitation to continue.</p>
            ) : loadingAssignments ? (
              <div className="flex items-center gap-2 text-gray-600 py-8">
                <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
                <span>Loading assignment details…</span>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selected.manuscript.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Due: {new Date(selected.invitation.dueAt).toLocaleDateString()}
                  </p>
                </div>

                <ReviewerManuscriptMaterials manuscript={selected.manuscript} />

                {submissionForSelected ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-green-900 bg-green-50 border border-green-200 rounded px-3 py-2">
                      You have already submitted your review for this manuscript.
                    </p>
                    <ReviewDetailReadOnly row={submissionForSelected} />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAccept()}
                        disabled={busy || selected.invitation.status === 'accepted'}
                        className="inline-flex items-center justify-center gap-2 min-h-[2.5rem] px-3 py-2 bg-green-600 text-white rounded text-sm cursor-pointer hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === 'accept' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                            Accepting…
                          </>
                        ) : (
                          'Accept invitation'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDecline()}
                        disabled={busy || selected.invitation.status === 'declined'}
                        className="inline-flex items-center justify-center gap-2 min-h-[2.5rem] px-3 py-2 bg-red-600 text-white rounded text-sm cursor-pointer hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === 'decline' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                            Declining…
                          </>
                        ) : (
                          'Decline invitation'
                        )}
                      </button>
                    </div>

                    {selected.invitation.status === 'invited' && (
                      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded px-3 py-2">
                        Accept the invitation before you can submit your review.
                      </p>
                    )}

                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Summary of findings"
                      rows={3}
                      disabled={busy}
                      className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <textarea
                      value={majorConcerns}
                      onChange={(e) => setMajorConcerns(e.target.value)}
                      placeholder="Major concerns"
                      rows={3}
                      disabled={busy}
                      className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <textarea
                      value={minorConcerns}
                      onChange={(e) => setMinorConcerns(e.target.value)}
                      placeholder="Minor concerns"
                      rows={3}
                      disabled={busy}
                      className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <textarea
                      value={confidential}
                      onChange={(e) => setConfidential(e.target.value)}
                      placeholder="Confidential comments to editor (optional)"
                      rows={2}
                      disabled={busy}
                      className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <select
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value as ReviewerRecommendation)}
                      disabled={busy}
                      className="w-full border border-gray-300 rounded px-3 py-2 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <option value="accept">Accept</option>
                      <option value="minor-revision">Minor revision</option>
                      <option value="major-revision">Major revision</option>
                      <option value="reject">Reject</option>
                    </select>

                    <button
                      type="button"
                      disabled={!canSubmit || busy}
                      onClick={() => void handleSubmitReview()}
                      className="inline-flex items-center justify-center gap-2 min-h-[2.5rem] px-4 py-2 bg-gray-900 text-white rounded cursor-pointer hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'submit' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                          Submitting…
                        </>
                      ) : (
                        'Submit review'
                      )}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Your submitted reviews</h2>
          <p className="text-sm text-gray-600 mb-4">
            Reviews you have already filed (newest first).
          </p>

          {loadingCompleted ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
              Loading submitted reviews…
            </div>
          ) : completedReviews.length === 0 ? (
            <p className="text-sm text-gray-500">No submitted reviews yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {completedReviews.map((row) => {
                const open = expandedSubmissionId === row.submission.id;
                return (
                  <li key={row.submission.id} className="bg-white">
                    <button
                      type="button"
                      onClick={() => setExpandedSubmissionId(open ? null : row.submission.id)}
                      className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {open ? (
                        <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" aria-hidden />
                      ) : (
                        <ChevronRight className="w-4 h-4 shrink-0 text-gray-500" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{row.manuscript.title}</p>
                        <p className="text-xs text-gray-500">
                          {row.manuscript.reference_code ?? row.manuscript.id.slice(0, 8)} ·{' '}
                          {recommendationLabel(row.submission.recommendation)} ·{' '}
                          {new Date(row.submission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    </button>
                    {open ? (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50/50">
                        <div className="pt-3 pl-7">
                          <ReviewDetailReadOnly row={row} />
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
