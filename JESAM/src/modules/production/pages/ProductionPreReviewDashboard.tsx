import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, FileSearch, Loader2, RotateCcw, Send, Tags, XCircle } from "lucide-react";
import { toast } from "sonner";
import ManuscriptPdfViewer from "@/components/common/ManuscriptPdfViewer";
import StatusBadge from "@/components/common/StatusBadge";
import type { AutomatedCheckSnapshot, Manuscript, ManuscriptStatus, SubmissionMetadata } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useManuscripts } from "@/modules/publication-impact/hooks/useManuscripts";
import {
  runAutomatedChecksSimulation,
  SIMILARITY_THRESHOLD_PERCENT,
} from "@/lib/automated-checks-runner";
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
      const message = result.message ? ` - ${result.message}` : "";
      return `${label}: ${result.status}${message}`;
    })
    .join("\n");
}

function getLatestProductionFileUrl(manuscript: Manuscript) {
  const latestRevision = manuscript.submission_metadata?.revision_cycle?.rounds?.slice(-1)[0];
  return latestRevision?.fileUrl || manuscript.file_url || null;
}

function topEntries(values: string[], limit = 5) {
  const counts = new Map<string, number>();
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

async function fileFromUrl(url: string, fallbackName: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch manuscript file (${response.status}).`);
  }

  const blob = await response.blob();
  const nameFromUrl = decodeURIComponent(url.split("?")[0].split("/").pop() ?? "");
  const fileName = nameFromUrl || `${fallbackName}.docx`;
  return new File([blob], fileName, { type: blob.type });
}

export default function ProductionPreReviewDashboard() {
  const { user } = useAuth();
  const { manuscripts, loading, error, fetchManuscripts, updateManuscript } = useManuscripts({
    filterStatus: "Production Checks",
  });
  const [selectedId, setSelectedId] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [draftChecks, setDraftChecks] = useState<Record<string, AutomatedCheckSnapshot>>({});
  const [decisionNote, setDecisionNote] = useState("");
  const [deciding, setDeciding] = useState<Decision | null>(null);

  const selected = useMemo(
    () => manuscripts.find((m) => m.id === selectedId) ?? manuscripts[0] ?? null,
    [manuscripts, selectedId]
  );

  const currentChecks =
    selected && (draftChecks[selected.id] ?? selected.submission_metadata?.automated_checks);
  const templateReport = selected?.submission_metadata?.template_check_report;
  const hasPersistedChecks = !!selected?.submission_metadata?.automated_checks;
  const checksPassed = checkPassed(currentChecks);
  const latestRevision = selected?.submission_metadata?.revision_cycle?.rounds?.slice(-1)[0];
  const selectedFileUrl = selected ? getLatestProductionFileUrl(selected) : null;
  const dashboard = useMemo(() => {
    const unchecked = manuscripts.filter((m) => !m.submission_metadata?.automated_checks);
    const checked = manuscripts.filter((m) => !!m.submission_metadata?.automated_checks);
    const failed = checked.filter((m) => !checkPassed(m.submission_metadata?.automated_checks));
    const returnedRevision = manuscripts.filter(
      (m) => (m.submission_metadata?.revision_cycle?.rounds?.length ?? 0) > 0
    );
    const oldest = [...manuscripts].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];
    const keywordStats = topEntries(manuscripts.flatMap((m) => m.keywords), 6);
    const subjectStats = topEntries(
      manuscripts.map((m) => m.submission_metadata?.subjectArea ?? ""),
      5
    );
    const similarityScores = manuscripts
      .map((m) => m.submission_metadata?.similarity_score)
      .filter((score): score is number => typeof score === "number");
    const averageSimilarity =
      similarityScores.length > 0
        ? Math.round(similarityScores.reduce((sum, score) => sum + score, 0) / similarityScores.length)
        : null;
    const metadataReady = manuscripts.filter(
      (m) =>
        m.keywords.length >= 3 &&
        !!m.submission_metadata?.subjectArea &&
        (m.submission_metadata?.author_details ?? []).every((author) => author.affiliation.trim())
    );

    return {
      unchecked,
      checked,
      failed,
      returnedRevision,
      oldest,
      keywordStats,
      subjectStats,
      averageSimilarity,
      metadataReady,
    };
  }, [manuscripts]);

  const runChecks = async (manuscript: Manuscript) => {
    const checkFileUrl = getLatestProductionFileUrl(manuscript);
    if (!checkFileUrl) {
      toast.error("This manuscript has no uploaded file.");
      return;
    }

    setRunningId(manuscript.id);
    setDraftChecks((prev) => ({ ...prev, [manuscript.id]: emptyChecks }));

    try {
      const file = await fileFromUrl(
        checkFileUrl,
        manuscript.reference_code ?? manuscript.id.slice(0, 8)
      );
      const result = await runAutomatedChecksSimulation(
        file,
        (partial) => {
          setDraftChecks((prev) => ({ ...prev, [manuscript.id]: partial }));
        },
        {
          manuscriptId: manuscript.id,
          fileUrl: checkFileUrl,
        }
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

      const success = await updateManuscript(manuscript.id, {
        submission_metadata,
      });
      if (success) {
        setDraftChecks((prev) => ({ ...prev, [manuscript.id]: result.checks }));
        toast.success("Production checks saved.");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not run production checks.";
      toast.error(message);
    } finally {
      setRunningId(null);
    }
  };

  const applyDecision = async (manuscript: Manuscript, decision: Decision) => {
    const checks = manuscript.submission_metadata?.automated_checks ?? draftChecks[manuscript.id];
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
        rejection_reason:
          decision === "reject" ? note || "Rejected after production checks" : prevMeta.rejection_reason,
        rejection_comments:
          decision === "reject" ? note || checkSummary : prevMeta.rejection_comments,
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
        setDecisionNote("");
        setSelectedId("");
        await fetchManuscripts();
        toast.success(messageByDecision[decision]);
      }
    } finally {
      setDeciding(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Pre-review production checks</h1>
          <p className="text-gray-600 mt-1">
            Run similarity, format, and asset checks after initial screening, then route the
            manuscript to Technical Editor peer review or back to the author.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
            <p className="mt-4 text-gray-600">Loading production checks queue...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {[
                ["Needs checks", dashboard.unchecked.length, "No saved check run"],
                ["Checks completed", dashboard.checked.length, "Ready for decision"],
                ["Checks with issues", dashboard.failed.length, "Likely return/reject"],
                ["Returned revisions", dashboard.returnedRevision.length, "Author resubmissions"],
                [
                  "Oldest queue age",
                  dashboard.oldest
                    ? Math.max(
                        0,
                        Math.floor(
                          (Date.now() - new Date(dashboard.oldest.created_at).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    : 0,
                  "Days since submission",
                ],
              ].map(([label, value, detail]) => (
                <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{detail}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5 lg:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">Pre-review knowledge signals</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Topic and metadata patterns visible to production before peer review routing.
                    </p>
                  </div>
                  <Tags className="w-5 h-5 text-blue-600 shrink-0" />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900">Queued keywords</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dashboard.keywordStats.map(([keyword, count]) => (
                        <span key={keyword} className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs text-blue-700">
                          {keyword} ({count})
                        </span>
                      ))}
                      {dashboard.keywordStats.length === 0 && (
                        <p className="text-sm text-gray-500">No queued keyword patterns yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900">Subject areas in checks</p>
                    <div className="mt-3 space-y-2">
                      {dashboard.subjectStats.map(([subject, count]) => (
                        <div key={subject} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-gray-700">{subject.replace(/-/g, " ")}</span>
                          <span className="font-semibold text-gray-900">{count}</span>
                        </div>
                      ))}
                      {dashboard.subjectStats.length === 0 && (
                        <p className="text-sm text-gray-500">Subject areas will appear after metadata capture.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">Indexing readiness</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Metadata quality before manuscripts leave production checks.
                    </p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-green-600 shrink-0" />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Metadata-ready</span>
                    <span className="font-semibold">
                      {dashboard.metadataReady.length}/{manuscripts.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average similarity</span>
                    <span className="font-semibold">
                      {dashboard.averageSimilarity ?? "No data"}{dashboard.averageSimilarity !== null ? "%" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Checks with issues</span>
                    <span className="font-semibold">{dashboard.failed.length}</span>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">Production checks queue</h2>
                  <p className="text-xs text-gray-500">{manuscripts.length} manuscript(s)</p>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchManuscripts()}
                  className="text-sm text-blue-700 hover:underline"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-2">
                {manuscripts.map((m) => {
                  const active = selected?.id === m.id;
                  const ref = m.reference_code ?? m.id.slice(0, 8).toUpperCase();
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedId(m.id)}
                      className={`w-full text-left p-3 border rounded-lg transition-colors ${
                        active ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ref}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{m.title}</p>
                        </div>
                        {m.submission_metadata?.automated_checks ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <FileSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
                {manuscripts.length === 0 && (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    No manuscripts are waiting for production checks.
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              {!selected ? (
                <p className="text-sm text-gray-500">Select a manuscript to run checks.</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        {selected.reference_code ?? selected.id.slice(0, 8).toUpperCase()}
                      </p>
                      <h2 className="text-xl font-semibold text-gray-900 mt-1">
                        {selected.title}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">{selected.authors.join(", ")}</p>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>

                  <ManuscriptPdfViewer
                    fileUrl={selectedFileUrl}
                    title={`${selected.title} manuscript PDF`}
                  />

                  {latestRevision && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-amber-950">
                            Latest author revision
                          </h3>
                          <p className="text-xs text-amber-800">
                            Revision {latestRevision.round} submitted{" "}
                            {new Date(latestRevision.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        {latestRevision.fileUrl && (
                          <a
                            href={latestRevision.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-amber-900 underline underline-offset-2"
                          >
                            Open revised file
                          </a>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                          Author revision summary
                        </p>
                        <p className="text-sm text-amber-950 whitespace-pre-wrap mt-1">
                          {latestRevision.authorNote || "No author summary provided."}
                        </p>
                      </div>
                      {latestRevision.responseLetter && (
                        <div className="border-t border-amber-200 pt-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                            Author response / comments
                          </p>
                          <p className="text-sm text-amber-950 whitespace-pre-wrap mt-1">
                            {latestRevision.responseLetter}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">Automated checks</h3>
                        <p className="text-sm text-gray-600">
                          Threshold: {SIMILARITY_THRESHOLD_PERCENT}% similarity.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={runningId === selected.id}
                        onClick={() => void runChecks(selected)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {runningId === selected.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileSearch className="w-4 h-4" />
                        )}
                        {hasPersistedChecks ? "Run checks again" : "Run checks"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(["formatting", "assets", "plagiarism"] as const).map((key) => {
                        const result = currentChecks?.[key] ?? emptyChecks[key];
                        return (
                          <div key={key} className={`border rounded-lg p-3 ${checkBadge(result.status)}`}>
                            <p className="text-xs uppercase font-semibold tracking-wide">{key}</p>
                            <p className="text-sm font-medium mt-1 capitalize">{result.status}</p>
                            {result.message && (
                              <p className="text-xs mt-2 leading-relaxed">{result.message}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {templateReport && (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              Template structure report
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Score {templateReport.score}/100 - {templateReport.wordCount} words -{" "}
                              {templateReport.substantiveWordCount ?? templateReport.wordCount} substantive -{" "}
                              {templateReport.imageCount} embedded image(s)
                            </p>
                          </div>
                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                              templateReport.passed
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {templateReport.passed ? "Passed" : "Needs attention"}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {templateReport.requiredSections.map((section) => (
                            <span
                              key={section.name}
                              className={`rounded-md border px-2 py-1 text-xs ${
                                section.found
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-red-200 bg-red-50 text-red-700"
                              }`}
                            >
                              {section.name}
                            </span>
                          ))}
                        </div>
                        {templateReport.issues.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {templateReport.issues.slice(0, 4).map((issue) => (
                              <p
                                key={`${issue.code}-${issue.message}`}
                                className="text-xs text-gray-700"
                              >
                                <span className="font-medium capitalize">{issue.severity}:</span>{" "}
                                {issue.message}
                              </p>
                            ))}
                          </div>
                        )}
                        {templateReport.formatting && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                              [
                                "Times New Roman",
                                templateReport.formatting.timesNewRomanRatio,
                                templateReport.formatting.directFontSamples,
                              ],
                              [
                                "12 pt size",
                                templateReport.formatting.size12Ratio,
                                templateReport.formatting.directSizeSamples,
                              ],
                              [
                                "2.0 spacing",
                                templateReport.formatting.doubleSpacingRatio,
                                templateReport.formatting.directLineSpacingSamples,
                              ],
                            ].map(([label, value, samples]) => (
                              <div key={label as string} className="rounded-md border border-gray-200 p-2">
                                <p className="text-xs font-medium text-gray-700">{label}</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {Number(samples) > 0 ? `${Math.round(Number(value) * 100)}%` : "No direct samples"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        {!!templateReport.redTemplateHintsRemaining?.length && (
                          <div className="mt-3 rounded-md border border-red-100 bg-red-50 p-3">
                            <p className="text-xs font-semibold text-red-800">
                              Red template hints still present
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-red-900">
                              {templateReport.redTemplateHintsRemaining.slice(0, 3).map((hint) => (
                                <li key={hint} className="line-clamp-2">
                                  {hint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Production decision</h3>
                      <p className="text-sm text-gray-600">
                        Decisions are enabled after checks have been run and saved.
                      </p>
                    </div>
                    <textarea
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                      placeholder="Optional note to include in audit/notification"
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        disabled={!currentChecks || deciding !== null}
                        onClick={() => void applyDecision(selected, "peer-review")}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Send to peer review
                      </button>
                      <button
                        type="button"
                        disabled={!currentChecks || deciding !== null}
                        onClick={() => void applyDecision(selected, "revision")}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Return to author
                      </button>
                      <button
                        type="button"
                        disabled={!currentChecks || deciding !== null}
                        onClick={() => void applyDecision(selected, "reject")}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                    {currentChecks && !checksPassed && (
                      <p className="text-xs text-amber-700">
                        At least one check did not pass. Production Editor can still return or reject
                        based on the recorded results.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
