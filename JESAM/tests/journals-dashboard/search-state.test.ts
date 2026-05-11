import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_PUBLIC_JOURNAL_FILTERS,
  PUBLIC_JOURNAL_SEARCHABLE_FIELDS,
  buildPublicJournalSearchDocument,
  filterPublicJournals,
  hasAppliedPublicJournalFilters,
  matchesPublicJournalSearchQuery,
  matchesPublicJournalFilters,
  normalizePublicJournalFilters,
  sanitizeJournalSearchQuery,
  tokenizeJournalSearchQuery,
} from "../../src/modules/journals-dashboard/search-state.ts";
import type { PublicJournalListItem } from "../../src/modules/journals-dashboard/types.ts";

const sampleJournal: PublicJournalListItem = {
  id: "jesam-water",
  title: "JESAM Water and Coastal Research",
  description:
    "Public archive slice focused on water systems, watersheds, estuaries, coastal monitoring, and aquatic environmental management.",
  institution:
    "University of the Philippines Los Banos - School of Environmental Science and Management",
  issn: "0119-1144-W",
  accessLabel: "Public metadata / downloadable papers vary by article",
  focusAreas: ["Water"],
  totalPublishedArticles: 7,
  latestPublicationDate: "2026-03-15T00:00:00.000Z",
  latestIssueLabel: "Vol. 32 No. 1",
  coverageYears: [2026, 2025, 2024],
};

test("sanitizeJournalSearchQuery trims and collapses whitespace", () => {
  assert.equal(
    sanitizeJournalSearchQuery("  coastal   monitoring   2026 "),
    "coastal monitoring 2026"
  );
});

test("tokenizeJournalSearchQuery normalizes case and removes empty tokens", () => {
  assert.deepEqual(tokenizeJournalSearchQuery("  Air   Quality "), [
    "air",
    "quality",
  ]);
});

test("buildPublicJournalSearchDocument includes current public-safe metadata", () => {
  const document = buildPublicJournalSearchDocument(sampleJournal);

  assert.match(document, /water and coastal research/);
  assert.match(document, /coastal monitoring/);
  assert.match(document, /2026/);
  assert.match(document, /vol\. 32 no\. 1/);
});

test("PUBLIC_JOURNAL_SEARCHABLE_FIELDS stays scoped to journal-level public metadata in Story 2.1", () => {
  assert.deepEqual(PUBLIC_JOURNAL_SEARCHABLE_FIELDS, [
    "journal-title",
    "journal-description",
    "institution",
    "classification",
    "access-label",
    "issn",
    "issue-label",
    "coverage-year",
  ]);
});

test("matchesPublicJournalSearchQuery requires every query token to be present", () => {
  assert.equal(
    matchesPublicJournalSearchQuery(sampleJournal, "coastal 2026"),
    true
  );
  assert.equal(
    matchesPublicJournalSearchQuery(sampleJournal, "coastal governance"),
    false
  );
});

test("matchesPublicJournalSearchQuery treats an empty query as browse-all", () => {
  assert.equal(matchesPublicJournalSearchQuery(sampleJournal, "   "), true);
});

test("normalizePublicJournalFilters keeps only supported filter values", () => {
  assert.deepEqual(
    normalizePublicJournalFilters({
      classification: "Water",
      journalId: "jesam-water",
      coverageYear: "2026",
    }),
    {
      classification: "Water",
      journalId: "jesam-water",
      coverageYear: "2026",
    }
  );

  assert.deepEqual(
    normalizePublicJournalFilters({
      classification: "Forests" as never,
      journalId: "  ",
      coverageYear: "",
    }),
    EMPTY_PUBLIC_JOURNAL_FILTERS
  );
});

test("hasAppliedPublicJournalFilters reports whether any active filter exists", () => {
  assert.equal(hasAppliedPublicJournalFilters(EMPTY_PUBLIC_JOURNAL_FILTERS), false);
  assert.equal(
    hasAppliedPublicJournalFilters({
      ...EMPTY_PUBLIC_JOURNAL_FILTERS,
      coverageYear: "2026",
    }),
    true
  );
});

test("matchesPublicJournalFilters respects classification, journal, and year", () => {
  assert.equal(
    matchesPublicJournalFilters(sampleJournal, {
      classification: "Water",
      journalId: "jesam-water",
      coverageYear: "2026",
    }),
    true
  );
  assert.equal(
    matchesPublicJournalFilters(sampleJournal, {
      classification: "Land",
      journalId: "",
      coverageYear: "",
    }),
    false
  );
});

test("filterPublicJournals applies both query and applied filters", () => {
  const filteredJournals = filterPublicJournals(
    [
      sampleJournal,
      {
        ...sampleJournal,
        id: "jesam-land",
        title: "JESAM Land Research",
        focusAreas: ["Land"],
        coverageYears: [2025],
      },
    ],
    "research",
    {
      classification: "Land",
      journalId: "",
      coverageYear: "2025",
    }
  );

  assert.deepEqual(filteredJournals.map((journal) => journal.id), ["jesam-land"]);
});
