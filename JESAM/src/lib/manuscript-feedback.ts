import type { Manuscript } from "@/types";

export function getAuthorDecisionFeedback(manuscript: Manuscript) {
  const meta = manuscript.submission_metadata;
  if (!meta) return null;

  if (manuscript.status === "Rejected") {
    const source = meta.production_decision_comments
      ? "Production Editor rejection"
      : "Initial screening rejection";
    const comments =
      meta.rejection_comments ??
      meta.production_decision_comments ??
      meta.screening_comments ??
      meta.rejection_reason;

    return {
      source,
      heading: "Editorial feedback",
      comments,
      reason: meta.rejection_reason,
      checkSummary: meta.production_check_summary,
    };
  }

  if (manuscript.status === "For Format Revision" && meta.production_decision_comments) {
    return {
      source: "Production Editor format revision",
      heading: "Revision guidance",
      comments: meta.production_decision_comments,
      reason: undefined,
      checkSummary: meta.production_check_summary,
    };
  }

  return null;
}
