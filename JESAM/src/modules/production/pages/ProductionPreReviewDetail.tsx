import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileSearch,
  History,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  Tag,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import ManuscriptPdfViewer from "@/components/common/ManuscriptPdfViewer";
import StatusBadge from "@/components/common/StatusBadge";
import type { AutomatedCheckSnapshot, Manuscript, ManuscriptStatus, SubmissionMetadata } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useManuscripts } from "@/modules/publication-impact/hooks/useManuscripts";
import { runAutomatedChecksSimulation, SIMILARITY_THRESHOLD_PERCENT } from "@/lib/automated-checks-runner";
import { appendAudit, appendNotification, getCorrespondingAuthorEmail } from "@/lib/workflow";

type Decision = "peer-review" | "revision" | "reject";

const emptyChecks: AutomatedCheckSnapshot = {
  formatting: { status: "pending", message: "" },
  assets: { status: "pending", message: "" },
  plagiarism: { status: "pending", message: "" },
};

function checkPassed(checks: AutomatedCheckSnapshot | undefined): boolean {
  return (
    checks?.formatting.status === "passed" &&
    checks.assets.status === "passed" &&
    checks.plagiarism.status === "passed"
  );
}

function checkBadge(status: string) {
  if (status === "passed") return "bg-green-50 text-green-700 border-green-200";
  if (status === "failed") return "bg-red-50 text-red-700 border-red-200";
  if (status === "checking") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

function summarizeChecks(checks: AutomatedCheckSnapshot): string {
  const labels: Array<[keyof AutomatedCheckSnapshot, string]> = [
    ["formatting", "Formatting"],
    ["assets", "Assets"],
    ["plagiarism", "Similarity"],
  ];
  return labels
    .map(([key, label]) => {
      const result = checks[key];
      return `${label}: ${result.status}${result.message ? ` - ${result.message}` : ""}`;
    })
    .join("\n");
}

function getLatestProductionFileUrl(manuscript: Manuscript) {
  const latestRevision = manuscript.submission_metadata?.revision_cycle?.rounds?.slice(-1)[0];
  return latestRevision?.fileUrl || manuscript.file_url || null;
}

async function fileFromUrl(url: string, fallbackName: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch manuscript file (${response.status}).`);
  const blob = await response.blob();
  const nameFromUrl = decodeURIComponent(url.split("?")[0].split("/").pop() ?? "");
  const fileName = nameFromUrl || `${fallbackName}.docx`;
  return new File([blob], fileName, { type: blob.type });
}

function formatSubject(value: string | undefined) {
  return value?.trim() ? value.replace(/-/g, " ") : "Not provided";
}

export default function ProductionPreReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { manuscripts, loading, error, fetchManuscripts, updateManuscript } = useManuscripts({
    filterStatus: "Production Checks",
  });
  const [running, setRunning] = useState(false);
  const [draftChecks, setDraftChecks] = useState<AutomatedCheckSnapshot | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [deciding, setDeciding] = useState<Decision | null>(null);

  useEffect(() => {
    void fetchManuscripts();
  }, [fetchManuscripts]);

  const manuscript = manuscripts.find((m) => m.id === id) ?? null;
  const currentChecks = draftChecks ?? manuscript?.submission_metadata?.automated_checks;
  const templateReport = manuscript?.submission_metadata?.template_check_report;
  const latestFileUrl = manuscript ? getLatestProductionFileUrl(manuscript) : null;
  const revisionRounds = useMemo(
    () =>
      [...(manuscript?.submission_metadata?.revision_cycle?.rounds ?? [])].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      ),
    [manuscript?.submission_metadata?.revision_cycle?.rounds]
  );

  const insights = useMemo(() => {
    if (!manuscript) return null;
    const meta = manuscript.submission_metadata;
    const authorDetails = meta?.author_details ?? [];
    const metadataReady =
      manuscript.keywords.length >= 3 &&
      !!meta?.subjectArea &&
      authorDetails.every((author) => author.affiliation.trim());
    return {
      metadataReady,
      authorCount: authorDetails.length || manuscript.authors.length,
      keywordCount: manuscript.keywords.length,
      revisionCount: revisionRounds.length,
      similarityScore: meta?.similarity_score,
    };
  }, [manuscript, revisionRounds.length]);

  const runChecks = async () => {
    if (!manuscript || !latestFileUrl) {
      toast.error("This manuscript has no uploaded file.");
      return;
    }
    setRunning(true);
    setDraftChecks(emptyChecks);
    try {
      const file = await fileFromUrl(latestFileUrl, manuscript.reference_code ?? manuscript.id.slice(0, 8));
      const result = await runAutomatedChecksSimulation(
        file,
        (partial) => setDraftChecks(partial),
        { manuscriptId: manuscript.id, fileUrl: latestFileUrl }
      );
      const submission_metadata: SubmissionMetadata = {
        ...(manuscript.submission_metadata ?? {}),
        automated_checks: result.checks,
        template_check_report: result.templateReport ?? manuscript.submission_metadata?.template_check_report,
        similarity_score: result.similarityScore,
        audit_logs: appendAudit(
          manuscript,
          user?.email ?? "production_editor",
          "production-checks-run",
          result.pass ? "Checks passed" : "Checks completed with issues"
        ),
      };
      const success = await updateManuscript(manuscript.id, { submission_metadata });
      if (success) {
        setDraftChecks(result.checks);
        toast.success("Production checks saved.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not run production checks.");
    } finally {
      setRunning(false);
    }
  };

  const applyDecision = async (decision: Decision) => {
    if (!manuscript) return;
    const checks = manuscript.submission_metadata?.automated_checks ?? draftChecks;
    if (!checks) {
      toast.error("Run production checks before making a decision.");
      return;
    }

    setDeciding(decision);
    try {
      const statusByDecision: Record<Decision, ManuscriptStatus> = {
        "peer-review": "Peer Review",
        revision: "For Format Revision",
        reject: "Rejected",
      };
      const actionByDecision: Record<Decision, string> = {
        "peer-review": "sent-to-technical-editor",
        revision: "returned-for-format-revision",
        reject: "production-rejected",
      };
      const messageByDecision: Record<Decision, string> = {
        "peer-review": "Production checks cleared; manuscript moved to peer review.",
        revision: "Production checks require format revision. Please upload a revised manuscript.",
        reject: "Manuscript rejected after production checks.",
      };
      const note = decisionNote.trim();
      const checkSummary = summarizeChecks(checks);
      const authorMessage =
        decision === "revision"
          ? `${messageByDecision.revision}\n\nProduction Editor comments:\n${note || "No additional comments provided."}\n\nCheck results:\n${checkSummary}`
          : decision === "reject"
            ? `${messageByDecision.reject}\n\nProduction Editor comments:\n${note || "No additional comments provided."}\n\nCheck results:\n${checkSummary}`
            : messageByDecision[decision];

      const prevMeta = manuscript.submission_metadata ?? {};
      const submission_metadata: SubmissionMetadata = {
        ...prevMeta,
        automated_checks: checks,
        production_decision_comments: note || undefined,
        production_check_summary: checkSummary,
        rejection_reason: decision === "reject" ? note || "Rejected after production checks" : prevMeta.rejection_reason,
        rejection_comments: decision === "reject" ? note || checkSummary : prevMeta.rejection_comments,
        notifications:
          decision === "peer-review"
            ? prevMeta.notifications
            : appendNotification(manuscript, {
                type: decision === "reject" ? "screening-decision" : "revision-requested",
                recipientRole: "author",
                recipientEmail: getCorrespondingAuthorEmail(manuscript),
                message: authorMessage,
              }),
        audit_logs: appendAudit(
          manuscript,
          user?.email ?? "production_editor",
          actionByDecision[decision],
          note || checkSummary
        ),
      };

      const success = await updateManuscript(manuscript.id, {
        status: statusByDecision[decision],
        submission_metadata,
      });
      if (success) {
        toast.success(messageByDecision[decision]);
        navigate("/production/pre-review");
      }
    } finally {
      setDeciding(null);
    }
  };

  if (loading && !manuscript) {
    return <div className="p-8 text-sm text-gray-600">Loading production check details...</div>;
  }

  if (error || !manuscript || !insights) {
    return (
      <div className="p-8">
        <Link to="/production/pre-review" className="inline-flex items-center gap-2 text-sm text-blue-700">
          <ArrowLeft className="w-4 h-4" />
          Back to production checks
        </Link>
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-gray-900">Manuscript not found</h1>
          <p className="mt-2 text-sm text-gray-600">
            {error ?? "This manuscript is unavailable or no longer waiting for production checks."}
          </p>
        </div>
      </div>
    );
  }

  const ref = manuscript.reference_code ?? manuscript.id.slice(0, 8).toUpperCase();
  const meta = manuscript.submission_metadata;
  const checksPassed = checkPassed(currentChecks);
  const insightCards: Array<{
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
  }> = [
    {
      label: "Metadata-ready",
      value: insights.metadataReady ? "Yes" : "Needs polish",
      detail: "Subject, keywords, affiliations",
      icon: ShieldCheck,
    },
    {
      label: "Similarity",
      value: insights.similarityScore == null ? "No run" : `${insights.similarityScore}%`,
      detail: `Threshold ${SIMILARITY_THRESHOLD_PERCENT}%`,
      icon: BarChart3,
    },
    {
      label: "Keywords",
      value: insights.keywordCount,
      detail: "Indexing and discovery",
      icon: Tag,
    },
    {
      label: "Versions",
      value: insights.revisionCount + 1,
      detail: "Initial plus author revisions",
      icon: History,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link to="/production/pre-review" className="mb-4 inline-flex items-center gap-2 text-sm text-blue-700">
                <ArrowLeft className="w-4 h-4" />
                Back to production checks
              </Link>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500">{ref}</span>
                <StatusBadge status={manuscript.status} />
              </div>
              <h1 className="max-w-4xl text-2xl font-bold text-gray-900 sm:text-3xl">{manuscript.title}</h1>
              <p className="mt-2 text-sm text-gray-600">
                Production Editor workspace for template checks, similarity screening, revision context, and routing.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:pt-8">
              <button
                type="button"
                disabled={!currentChecks || deciding !== null}
                onClick={() => void applyDecision("peer-review")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Peer review
              </button>
              <button
                type="button"
                disabled={!currentChecks || deciding !== null}
                onClick={() => void applyDecision("revision")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Return
              </button>
              <button
                type="button"
                disabled={!currentChecks || deciding !== null}
                onClick={() => void applyDecision("reject")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {insightCards.map(({ label, value, detail, icon: IconComponent }) => {
            return (
              <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
                    <p className="mt-1 text-xs text-gray-500">{detail}</p>
                  </div>
                  <IconComponent className="h-5 w-5 shrink-0 text-blue-600" />
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {meta?.screening_comments || meta?.screening_decided_by || meta?.screening_decided_at ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h2 className="font-semibold text-blue-950">Initial screening turnover</h2>
                <p className="mt-1 text-xs text-blue-800">
                  {meta?.screening_decided_by ?? "EIC / Managing Editor"}
                  {meta?.screening_decided_at ? ` - ${new Date(meta.screening_decided_at).toLocaleString()}` : ""}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-blue-950">
                  {meta?.screening_comments || "No additional turnover comments were provided."}
                </p>
              </div>
            ) : null}

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-4 font-semibold text-gray-900">Current manuscript file</h2>
              <ManuscriptPdfViewer fileUrl={latestFileUrl} title={`${manuscript.title} manuscript`} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Automated production checks</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Run format/template, asset, and similarity checks against the current file version.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={running}
                  onClick={() => void runChecks()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                  {currentChecks ? "Run checks again" : "Run checks"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {(["formatting", "assets", "plagiarism"] as const).map((key) => {
                  const result = currentChecks?.[key] ?? emptyChecks[key];
                  return (
                    <div key={key} className={`rounded-lg border p-3 ${checkBadge(result.status)}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide">{key}</p>
                      <p className="mt-1 text-sm font-medium capitalize">{result.status}</p>
                      {result.message && <p className="mt-2 text-xs leading-relaxed">{result.message}</p>}
                    </div>
                  );
                })}
              </div>
              {currentChecks && !checksPassed && (
                <p className="mt-3 text-xs text-amber-700">
                  One or more checks need attention. Returning to author keeps the check summary in the notification.
                </p>
              )}
            </div>

            {templateReport && (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">Template structure report</h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Score {templateReport.score}/100 - {templateReport.wordCount} words - {templateReport.imageCount} image(s)
                    </p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${templateReport.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {templateReport.passed ? "Passed" : "Needs attention"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {templateReport.requiredSections.map((section) => (
                    <span key={section.name} className={`rounded-md border px-2 py-1 text-xs ${section.found ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                      {section.name}
                    </span>
                  ))}
                </div>
                {templateReport.issues.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {templateReport.issues.slice(0, 5).map((issue) => (
                      <p key={`${issue.code}-${issue.message}`} className="text-xs text-gray-700">
                        <span className="font-medium capitalize">{issue.severity}:</span> {issue.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="font-semibold text-gray-900">Decision note</h2>
              <p className="mt-1 text-sm text-gray-600">
                Included in audit logs and author notifications for return/reject decisions.
              </p>
              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                rows={5}
                placeholder="Production Editor comments..."
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="font-semibold text-gray-900">Manuscript metadata</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Authors</p>
                  <p className="mt-1 text-gray-800">{manuscript.authors.join(", ")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subject area</p>
                  <p className="mt-1 capitalize text-gray-800">{formatSubject(meta?.subjectArea)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Funding</p>
                  <p className="mt-1 text-gray-800">{meta?.funding || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Competing interests</p>
                  <p className="mt-1 text-gray-800">{meta?.competingInterests || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ethical approvals</p>
                  <p className="mt-1 text-gray-800">{meta?.ethicalApprovals || "Not provided"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Revision history</h2>
              </div>
              <div className="space-y-3">
                {revisionRounds.slice(0, 5).map((round) => (
                  <div key={round.id} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-medium text-gray-900">v{round.round} Author revision</p>
                    <p className="mt-1 text-xs text-gray-500">{new Date(round.submittedAt).toLocaleString()}</p>
                    <p className="mt-2 line-clamp-3 text-xs text-gray-700">{round.authorNote || "No revision summary provided."}</p>
                    {round.fileUrl && (
                      <a href={round.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-blue-700 hover:underline">
                        Open revised file
                      </a>
                    )}
                  </div>
                ))}
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900">v1 Initial submission</p>
                  <p className="mt-1 text-xs text-gray-500">{new Date(manuscript.created_at).toLocaleString()}</p>
                  {manuscript.file_url && (
                    <a href={manuscript.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-blue-700 hover:underline">
                      Open file
                    </a>
                  )}
                </div>
                {revisionRounds.length === 0 && (
                  <p className="text-sm text-gray-500">No author revision uploads yet; showing the initial submission only.</p>
                )}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
