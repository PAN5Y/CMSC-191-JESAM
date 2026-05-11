import type {
  PublicJournalFilters,
  PublicJournalFocusArea,
  PublicJournalListItem,
  PublicJournalSearchableField,
} from "./types";

export const PUBLIC_JOURNAL_SEARCHABLE_FIELDS: PublicJournalSearchableField[] = [
  "journal-title",
  "journal-description",
  "institution",
  "classification",
  "access-label",
  "issn",
  "issue-label",
  "coverage-year",
];

export const PUBLIC_JOURNAL_FOCUS_AREAS: PublicJournalFocusArea[] = [
  "Land",
  "Air",
  "Water",
  "People",
];

export const EMPTY_PUBLIC_JOURNAL_FILTERS: PublicJournalFilters = {
  classification: "",
  journalId: "",
  coverageYear: "",
};

export function sanitizeJournalSearchQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().trim();
}

export function tokenizeJournalSearchQuery(value: string) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter(Boolean);
}

export function buildPublicJournalSearchDocument(journal: PublicJournalListItem) {
  return normalizeSearchText(
    [
      journal.title,
      journal.description,
      journal.institution,
      journal.issn,
      journal.accessLabel,
      journal.latestIssueLabel,
      ...journal.focusAreas,
      ...journal.coverageYears.map(String),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function matchesPublicJournalSearchQuery(
  journal: PublicJournalListItem,
  appliedQuery: string
) {
  const queryTokens = tokenizeJournalSearchQuery(appliedQuery);

  if (queryTokens.length === 0) {
    return true;
  }

  const searchDocument = buildPublicJournalSearchDocument(journal);
  return queryTokens.every((token) => searchDocument.includes(token));
}

export function normalizePublicJournalFilters(
  filters?: Partial<PublicJournalFilters>
): PublicJournalFilters {
  const classification = filters?.classification;

  return {
    classification:
      classification && PUBLIC_JOURNAL_FOCUS_AREAS.includes(classification)
        ? classification
        : "",
    journalId: filters?.journalId?.trim() ?? "",
    coverageYear: filters?.coverageYear?.trim() ?? "",
  };
}

export function hasAppliedPublicJournalFilters(filters: PublicJournalFilters) {
  return Boolean(
    filters.classification || filters.journalId || filters.coverageYear
  );
}

export function matchesPublicJournalFilters(
  journal: PublicJournalListItem,
  filters: PublicJournalFilters
) {
  if (filters.classification && !journal.focusAreas.includes(filters.classification)) {
    return false;
  }

  if (filters.journalId && journal.id !== filters.journalId) {
    return false;
  }

  if (filters.coverageYear && !journal.coverageYears.includes(Number(filters.coverageYear))) {
    return false;
  }

  return true;
}

export function filterPublicJournals(
  journals: PublicJournalListItem[],
  appliedQuery: string,
  filters: PublicJournalFilters
) {
  return journals.filter(
    (journal) =>
      matchesPublicJournalSearchQuery(journal, appliedQuery) &&
      matchesPublicJournalFilters(journal, filters)
  );
}
