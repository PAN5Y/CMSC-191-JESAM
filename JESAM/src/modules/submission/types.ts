// Author Information
export interface Author {
  id: string;
  name: string;
  email: string;
  orcid?: string;
  affiliation: string;
  isCorresponding: boolean;
}

// Manuscript/Publication
export interface Manuscript {
  id: string;
  manuscriptId: string;
  dateSubmitted: string;
  title: string;
  authors: Author[];
  abstract: string;
  keywords: string[];
  classification: 'Land' | 'Air' | 'Water' | 'People';
  status: SubmissionStatus;
  similarity?: number; // Plagiarism percentage
  formattingStatus?: 'passed' | 'failed' | 'pending';
}

export type SubmissionStatus = 
  | 'In Submission Queue'
  | 'Administrative Check'
  | 'Editor In Chief Screening'
  | 'Peer Review'
  | 'Published'
  | 'Rejected';

// Research Metadata
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
export type CheckStatus = 'pending' | 'checking' | 'passed' | 'failed';

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
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

// Editor Decision
export type EditorDecision = 'approve' | 'reject' | 'return-for-formatting';

export interface ScreeningDecision {
  manuscriptId: string;
  decision: EditorDecision;
  rejectionReason?: string;
  comments?: string;
  decidedAt: string;
  decidedBy: string;
}
