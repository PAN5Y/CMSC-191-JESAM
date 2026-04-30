import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ResearchMetadata, Author, AutomatedCheckResult, AdministrativeDeclarations } from "../types";

const defaultMetadata: ResearchMetadata = {
  title: "",
  abstract: "",
  keywords: "",
  focus: "",
  subjectArea: "",
  funding: "",
  competingInterests: "",
  ethicalApprovals: "",
};

const defaultChecks: AutomatedCheckResult = {
  formatting: { status: "pending", message: "" },
  assets: { status: "pending", message: "" },
  plagiarism: { status: "pending", message: "" },
};

const defaultDeclarations: AdministrativeDeclarations = {
  noCompetingInterests: false,
  ethicalStandards: false,
  dataAvailability: false,
  authorshipContribution: false,
};

function defaultAuthors(): Author[] {
  return [
    {
      id: "1",
      name: "",
      email: "",
      orcid: "",
      affiliation: "",
      isCorresponding: true,
    },
  ];
}

export interface SubmissionWizardContextValue {
  metadata: ResearchMetadata;
  setMetadata: (m: ResearchMetadata | ((prev: ResearchMetadata) => ResearchMetadata)) => void;
  authors: Author[];
  setAuthors: (a: Author[] | ((prev: Author[]) => Author[])) => void;
  checks: AutomatedCheckResult;
  setChecks: (c: AutomatedCheckResult | ((prev: AutomatedCheckResult) => AutomatedCheckResult)) => void;
  declarations: AdministrativeDeclarations;
  setDeclarations: (
    d: AdministrativeDeclarations | ((prev: AdministrativeDeclarations) => AdministrativeDeclarations)
  ) => void;
  manuscriptFile: File | null;
  setManuscriptFile: (f: File | null) => void;
  resetWizard: () => void;
  isMetadataStepValid: boolean;
  isAuthorsStepValid: boolean;
  isChecksStepValid: boolean;
  isAdminStepValid: boolean;
}

const SubmissionWizardContext = createContext<SubmissionWizardContextValue | null>(null);

function validateMetadata(m: ResearchMetadata): boolean {
  return (
    m.title.trim().length > 0 &&
    m.abstract.trim().length > 0 &&
    m.keywords.trim().length > 0 &&
    ["Land", "Air", "Water", "People"].includes(m.focus) &&
    m.subjectArea.trim().length > 0 &&
    m.funding.trim().length > 0 &&
    m.competingInterests.trim().length > 0 &&
    m.ethicalApprovals.trim().length > 0
  );
}

function validateAuthors(list: Author[]): boolean {
  if (list.length === 0) return false;
  const corr = list.filter((a) => a.isCorresponding);
  if (corr.length !== 1) return false;
  return list.every(
    (a) =>
      a.name.trim().length > 0 &&
      a.email.trim().length > 0 &&
      (a.orcid ?? "").trim().length > 0 &&
      a.affiliation.trim().length > 0
  );
}

function validateChecks(c: AutomatedCheckResult, hasFile: boolean): boolean {
  if (!hasFile) return false;
  return (
    c.formatting.status === "passed" &&
    c.assets.status === "passed" &&
    c.plagiarism.status === "passed"
  );
}

function validateDeclarations(d: AdministrativeDeclarations): boolean {
  return (
    d.noCompetingInterests &&
    d.ethicalStandards &&
    d.dataAvailability &&
    d.authorshipContribution
  );
}

export function SubmissionWizardProvider({ children }: { children: ReactNode }) {
  const [metadata, setMetadata] = useState<ResearchMetadata>(defaultMetadata);
  const [authors, setAuthors] = useState<Author[]>(defaultAuthors);
  const [checks, setChecks] = useState<AutomatedCheckResult>(defaultChecks);
  const [declarations, setDeclarations] = useState<AdministrativeDeclarations>(defaultDeclarations);
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);

  const resetWizard = useCallback(() => {
    setMetadata(defaultMetadata);
    setAuthors(defaultAuthors());
    setChecks(defaultChecks);
    setDeclarations(defaultDeclarations);
    setManuscriptFile(null);
  }, []);

  const value = useMemo<SubmissionWizardContextValue>(
    () => ({
      metadata,
      setMetadata,
      authors,
      setAuthors,
      checks,
      setChecks,
      declarations,
      setDeclarations,
      manuscriptFile,
      setManuscriptFile,
      resetWizard,
      isMetadataStepValid: validateMetadata(metadata),
      isAuthorsStepValid: validateAuthors(authors),
      isChecksStepValid: validateChecks(checks, !!manuscriptFile),
      isAdminStepValid: validateDeclarations(declarations),
    }),
    [metadata, authors, checks, declarations, manuscriptFile, resetWizard]
  );

  return (
    <SubmissionWizardContext.Provider value={value}>{children}</SubmissionWizardContext.Provider>
  );
}

export function useSubmissionWizard(): SubmissionWizardContextValue {
  const ctx = useContext(SubmissionWizardContext);
  if (!ctx) {
    throw new Error("useSubmissionWizard must be used within SubmissionWizardProvider");
  }
  return ctx;
}
