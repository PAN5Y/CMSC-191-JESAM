import type { ComponentType } from "react";
import type { SubmissionAuthorDetail } from "@/types";

/** Author row in the submission wizard (same shape as stored in submission_metadata). */
export type Author = SubmissionAuthorDetail;

// Research Metadata (wizard step 1)
export interface ResearchMetadata {
  title: string;
  abstract: string;
  keywords: string;
  focus: string;
  subjectArea: string;
  funding: string;
  competingInterests: string;
  ethicalApprovals: string;
}

// Automated Check Results
export type CheckStatus = "pending" | "checking" | "passed" | "failed";

export interface AutomatedCheckResult {
  formatting: {
    status: CheckStatus;
    message: string;
  };
  assets: {
    status: CheckStatus;
    message: string;
  };
  plagiarism: {
    status: CheckStatus;
    message: string;
  };
}

// Administrative Declarations
export interface AdministrativeDeclarations {
  noCompetingInterests: boolean;
  ethicalStandards: boolean;
  dataAvailability: boolean;
  authorshipContribution: boolean;
}

// Submission Workflow Step
export interface SubmissionStep {
  id: number;
  title: string;
  icon: ComponentType<unknown>;
  component: ComponentType<unknown>;
}

// EIC Decision (submission phase)
export type EditorDecision = "approve" | "reject" | "return-to-author";

/** EIC / screening decision; `id` is the manuscripts row UUID. */
export interface ScreeningDecision {
  id: string;
  decision: EditorDecision;
  rejectionReason?: string;
  comments?: string;
  decidedAt: string;
  decidedBy: string;
}
