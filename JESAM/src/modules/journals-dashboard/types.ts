export type PublicJournalFocusArea = "Land" | "Air" | "Water" | "People";

export interface PublicJournalFilters {
  classification: PublicJournalFocusArea | "";
  journalId: string;
  coverageYear: string;
}

export type PublicJournalSearchableField =
  | "article-title"
  | "authors"
  | "abstract-excerpt"
  | "journal-title"
  | "journal-context"
  | "journal-description"
  | "institution"
  | "classification"
  | "access-label"
  | "issn"
  | "issue-label"
  | "coverage-year";

export interface PublicJournalListItem {
  id: string;
  title: string;
  description: string;
  institution: string;
  issn?: string;
  accessLabel: string;
  focusAreas: PublicJournalFocusArea[];
  totalPublishedArticles: number;
  latestPublicationDate: string | null;
  latestIssueLabel: string | null;
  coverageYears: number[];
}

export interface PublicJournalArticlePreview {
  id: string;
  title: string;
  authors: string[];
  classification?: PublicJournalFocusArea;
  abstractExcerpt?: string;
  publishedAt: string | null;
  issueLabel: string | null;
}

export interface PublicArticleDetail {
  id: string;
  journalId: string;
  journalTitle: string;
  title: string;
  authors: string[];
  abstract?: string;
  classification?: PublicJournalFocusArea;
  publishedAt: string | null;
  issueLabel: string | null;
  doi?: string;
  keywords: string[];
}

export interface PublicArticleSearchResult {
  articleId: string;
  title: string;
  authors: string[];
  journalId: string;
  journalTitle: string;
  classification?: PublicJournalFocusArea;
  publishedAt: string | null;
  issueLabel: string | null;
  abstractExcerpt?: string;
}

export interface PublicJournalDetail {
  id: string;
  title: string;
  description: string;
  institution: string;
  issn?: string;
  accessLabel: string;
  focusAreas: PublicJournalFocusArea[];
  totalPublishedArticles: number;
  latestPublicationDate: string | null;
  latestIssueLabel: string | null;
  coverageYears: number[];
  articlePreviews: PublicJournalArticlePreview[];
}

export interface PublicArticleDetailRouteState {
  returnTo?: string;
  returnLabel?: string;
  journalId?: string;
  journalTitle?: string;
}

export interface PublicJournalDetailRouteState {
  returnTo?: string;
  returnLabel?: string;
}

export interface PublicJournalSearchState {
  draftQuery: string;
  appliedQuery: string;
  hasAppliedQuery: boolean;
  draftFilters: PublicJournalFilters;
  appliedFilters: PublicJournalFilters;
  hasAppliedFilters: boolean;
  validationMessage: string | null;
  searchableFields: PublicJournalSearchableField[];
}
