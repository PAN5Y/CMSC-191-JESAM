/**
 * Shared rule-based FAQ answers for the assistive chatbot and public article assistant panel.
 * Aligns with proposal: non-authoritative workflow guidance only.
 */

export const CHATBOT_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "What are the required submission metadata fields?",
    a: "Title, abstract, keywords, focus area (Land/Air/Water/People), subject area, funding, conflict and ethical declarations, and complete author details including ORCID and affiliations.",
  },
  {
    q: "What similarity threshold is used in screening?",
    a: "The current workflow enforces a 30% threshold in simulated screening. Editorial decisions remain human-controlled.",
  },
  {
    q: "Who can desk reject submissions?",
    a: "Editor-in-Chief performs the initial screening decisions and may desk reject, return to author, or proceed to peer review.",
  },
];

export function answerWorkflowQuestion(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("template") || q.includes("format")) {
    return "Use the JESAM manuscript template and ensure formatting/assets checks pass before final submission.";
  }
  if (q.includes("orcid")) {
    return "All authors should include ORCID and full affiliation for indexing and transparency.";
  }
  if (q.includes("revision")) {
    return "Revision rounds are versioned. Submit a revision note and a response-to-reviewers summary for each cycle.";
  }
  if (q.includes("peer") && q.includes("review")) {
    return "Peer review runs in-system with invitations, deadlines, and structured reviews. Editors consolidate recommendations.";
  }
  return "I can help with submission, review, revision, and publication FAQs. Editorial decisions are always made by human roles.";
}
