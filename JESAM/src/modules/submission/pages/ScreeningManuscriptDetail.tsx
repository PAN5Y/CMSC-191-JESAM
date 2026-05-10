import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Scale,
  ShieldCheck,
  Tag,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ManuscriptPdfViewer from "@/components/common/ManuscriptPdfViewer";
import StatusBadge from "@/components/common/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import type { Manuscript, SubmissionAuthorDetail } from "@/types";
import { useSubmissions } from "../hooks/useSubmissions";
import type { EditorDecision, ScreeningDecision } from "../types";

function daysSince(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function formatSubject(value: string | undefined) {
  return value?.trim() ? value.replace(/-/g, " ") : "Not provided";
}

function authorRows(manuscript: Manuscript): SubmissionAuthorDetail[] {
  const details = manuscript.submission_metadata?.author_details ?? [];
  if (details.length > 0) return details;
  return manuscript.authors.map((name, index) => ({
    id: `${manuscript.id}-author-${index}`,
    name,
    email: "Not provided",
    affiliation: "Not provided",
    isCorresponding: index === 0,
  }));
}

const rejectionReasons = [
  "Not aligned with JESAM theme",
  "Insufficient methodological rigor",
  "Scope too narrow or too broad",
  "Language quality issues",
  "Ethical concerns",
  "Duplicate submission",
  "Other (specify in comments)",
];

export default function ScreeningManuscriptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { manuscripts, loading, error, fetchManuscripts, recordScreeningDecision } =
    useSubmissions();
  const [decisionIntent, setDecisionIntent] = useState<EditorDecision | null>(null);
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState(rejectionReasons[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchManuscripts();
  }, [fetchManuscripts]);

  const manuscript = manuscripts.find((item) => item.id === id) ?? null;

  const insights = useMemo(() => {
    if (!manuscript) return null;
    const meta = manuscript.submission_metadata;
    const authors = authorRows(manuscript);
    const declarations = meta?.declarations ?? {};
    const completeAuthors = authors.filter(
      (author) => author.name.trim() && author.email.trim() && author.affiliation.trim()
    ).length;
    const orcidCount = authors.filter((author) => author.orcid?.trim()).length;
    const declarationCount = [
      declarations.noCompetingInterests,
      declarations.ethicalStandards,
      declarations.dataAvailability,
      declarations.authorshipContribution,
    ].filter(Boolean).length;
    const metadataItems = [
      manuscript.title,
      manuscript.abstract,
      manuscript.keywords.length >= 3 ? "keywords" : "",
      meta?.subjectArea,
      meta?.funding,
      meta?.competingInterests,
      meta?.ethicalApprovals,
      manuscript.file_url,
    ].filter(Boolean).length;

    return {
      authors,
      completeAuthors,
      orcidCount,
      declarationCount,
      metadataScore: Math.round((metadataItems / 8) * 100),
      abstractWords: words(manuscript.abstract),
      queueAge: daysSince(manuscript.created_at),
      keywordCount: manuscript.keywords.length,
    };
  }, [manuscript]);

  const submitDecision = async () => {
    if (!manuscript || !decisionIntent) return;
    setSubmitting(true);
    try {
      const decision: ScreeningDecision = {
        id: manuscript.id,
        decision: decisionIntent,
        rejectionReason: decisionIntent === "reject" ? rejectionReason : undefined,
        comments: comments.trim() || undefined,
        decidedAt: new Date().toISOString(),
        decidedBy: user?.email ?? user?.id ?? "unknown",
      };
      await recordScreeningDecision(decision);
      navigate("/submission/screening");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !manuscript) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading manuscript details...</p>
      </div>
    );
  }

  if (error || !manuscript || !insights) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link to="/submission/screening" className="inline-flex items-center gap-2 text-sm text-blue-700">
            <ArrowLeft className="w-4 h-4" />
            Back to screening
          </Link>
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-8">
            <h1 className="text-xl font-semibold text-gray-900">Manuscript not found</h1>
            <p className="text-sm text-gray-600 mt-2">
              {error ?? "This manuscript is unavailable or no longer in the screening queue."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const meta = manuscript.submission_metadata;
  const ref = manuscript.reference_code ?? manuscript.id.slice(0, 8).toUpperCase();
  const insightCards: Array<{
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
  }> = [
    {
      label: "Metadata score",
      value: `${insights.metadataScore}%`,
      detail: "Required submission fields captured",
      icon: FileText,
    },
    {
      label: "Keywords",
      value: insights.keywordCount,
      detail: "Useful for JESAM topic intelligence",
      icon: Tag,
    },
    {
      label: "Author ORCID",
      value: `${insights.orcidCount}/${insights.authors.length}`,
      detail: "Indexing and author identity",
      icon: Users,
    },
    {
      label: "Declarations",
      value: `${insights.declarationCount}/4`,
      detail: "Ethics, data, conflict, authorship",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <Link to="/submission/screening" className="inline-flex items-center gap-2 text-sm text-blue-700 mb-4">
                <ArrowLeft className="w-4 h-4" />
                Back to screening queue
              </Link>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-500">{ref}</span>
                <StatusBadge status={manuscript.status} />
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {insights.queueAge} days in queue
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 max-w-4xl">
                {manuscript.title}
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Initial screening details for EIC / Managing Editor decision.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 lg:pt-8">
              <button
                type="button"
                onClick={() => setDecisionIntent("reject")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                type="button"
                onClick={() => setDecisionIntent("approve")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-800"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {insightCards.map(({ label, value, detail, icon: IconComponent }) => {
            return (
              <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{detail}</p>
                  </div>
                  <IconComponent className="w-5 h-5 text-blue-600 shrink-0" />
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Manuscript file</h2>
              <ManuscriptPdfViewer fileUrl={manuscript.file_url} title={`${manuscript.title} manuscript`} />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Abstract and indexing metadata</h2>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {manuscript.abstract}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {manuscript.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs text-blue-700">
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Focus</p>
                  <p className="font-medium text-gray-900">{manuscript.classification ?? "Unclassified"}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Subject area</p>
                  <p className="font-medium capitalize text-gray-900">{formatSubject(meta?.subjectArea)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Abstract length</p>
                  <p className="font-medium text-gray-900">{insights.abstractWords} words</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Author information</h2>
              </div>
              <div className="space-y-3">
                {insights.authors.map((author) => (
                  <div key={author.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {author.name}
                          {author.isCorresponding && (
                            <span className="ml-2 rounded-full bg-green-50 border border-green-100 px-2 py-0.5 text-[11px] text-green-700">
                              Corresponding
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{author.email}</p>
                      </div>
                      <p className="text-xs text-gray-500">{author.orcid || "No ORCID"}</p>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{author.affiliation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Declarations</h2>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["No competing interests", meta?.declarations?.noCompetingInterests],
                  ["Ethical standards", meta?.declarations?.ethicalStandards],
                  ["Data availability", meta?.declarations?.dataAvailability],
                  ["Authorship contribution", meta?.declarations?.authorshipContribution],
                ].map(([label, ok]) => (
                  <div key={String(label)} className="flex items-center justify-between gap-3">
                    <span className="text-gray-700">{label}</span>
                    <span className={`rounded-full px-2 py-1 text-xs ${ok ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {ok ? "Confirmed" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Funding, competing interests, ethics</h2>
              {[
                ["Funding information", meta?.funding],
                ["Competing interests", meta?.competingInterests],
                ["Ethical approvals", meta?.ethicalApprovals],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {value || "Not provided"}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg border border-blue-100 p-5">
              <h2 className="font-semibold text-blue-950">Screening insight</h2>
              <p className="text-sm text-blue-900 mt-2">
                Approving this manuscript sends it to Production Checks. Any comments entered with
                the approval will be visible to the Production Editor as turnover context.
              </p>
            </div>
          </aside>
        </section>
      </main>

      {decisionIntent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {decisionIntent === "approve" ? "Approve for production checks" : "Reject manuscript"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{ref} - comments are optional.</p>
              </div>
              <button
                type="button"
                onClick={() => setDecisionIntent(null)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {decisionIntent === "reject" && (
                <div>
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-900 mb-2">
                    Rejection reason
                  </label>
                  <select
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {rejectionReasons.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="screeningComments" className="block text-sm font-medium text-gray-900 mb-2">
                  EIC / Managing Editor comments
                </label>
                <textarea
                  id="screeningComments"
                  value={comments}
                  onChange={(event) => setComments(event.target.value)}
                  rows={5}
                  placeholder={
                    decisionIntent === "approve"
                      ? "Optional turnover notes for the Production Editor..."
                      : "Optional comments for the author and audit trail..."
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 p-5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDecisionIntent(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitDecision()}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  decisionIntent === "approve" ? "bg-green-700 hover:bg-green-800" : "bg-red-700 hover:bg-red-800"
                }`}
              >
                {submitting ? "Saving..." : decisionIntent === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
