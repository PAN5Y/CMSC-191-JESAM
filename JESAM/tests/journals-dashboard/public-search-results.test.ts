import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPublicArticleSearchDocument,
  comparePublicArticleSearchResults,
  filterPublicArticleSearchResults,
  filterPublicArticleSearchResultsWithFilters,
  matchesPublicArticleSearchResult,
  matchesPublicArticleSearchFilters,
} from "../../src/modules/journals-dashboard/queries/publicSearchResultMatchers.ts";
import type { PublicArticleSearchResult } from "../../src/modules/journals-dashboard/types.ts";

const sampleResults: PublicArticleSearchResult[] = [
  {
    articleId: "article-land",
    title: "Soil Carbon Recovery in Upland Landscapes",
    authors: ["Ana Cruz", "Marco Santos"],
    journalId: "jesam-land",
    journalTitle: "JESAM Land Systems Review",
    abstractExcerpt:
      "This study evaluates soil carbon recovery, erosion pressure, and upland resilience across agricultural landscapes.",
    classification: "Land",
    publishedAt: "2026-03-12T00:00:00.000Z",
    issueLabel: "Vol. 32 No. 1",
  },
  {
    articleId: "article-water",
    title: "Coastal Monitoring for Estuary Restoration",
    authors: ["Lia Ramos", "Paolo Dizon"],
    journalId: "jesam-water",
    journalTitle: "JESAM Water and Coastal Research",
    abstractExcerpt:
      "A coastal monitoring framework for estuary restoration that compares water-quality signals and shoreline pressure.",
    classification: "Water",
    publishedAt: "2026-04-08T00:00:00.000Z",
    issueLabel: "Vol. 32 No. 2",
  },
];

test("comparePublicArticleSearchResults sorts newer published results first", () => {
  const results = [...sampleResults].sort(comparePublicArticleSearchResults);

  assert.deepEqual(results.map((result) => result.articleId), [
    "article-water",
    "article-land",
  ]);
});

test("buildPublicArticleSearchDocument includes article and journal context cues", () => {
  const [result] = sampleResults;
  const document = buildPublicArticleSearchDocument(result);

  assert.match(document, /soil carbon recovery/);
  assert.match(document, /jesam land systems review/);
  assert.match(document, /ana cruz/);
  assert.match(document, /vol\. 32 no\. 1/);
});

test("matchesPublicArticleSearchResult requires every token to appear across the public-safe result context", () => {
  const [, result] = sampleResults;

  assert.equal(matchesPublicArticleSearchResult(result, "coastal estuary"), true);
  assert.equal(matchesPublicArticleSearchResult(result, "coastal governance"), false);
});

test("filterPublicArticleSearchResults keeps only matching published article results", () => {
  const filteredResults = filterPublicArticleSearchResults(
    sampleResults,
    "upland resilience"
  );

  assert.deepEqual(filteredResults.map((result) => result.articleId), [
    "article-land",
  ]);
});

test("matchesPublicArticleSearchFilters respects classification, journal, and year", () => {
  assert.equal(
    matchesPublicArticleSearchFilters(sampleResults[0], {
      classification: "Land",
      journalId: "jesam-land",
      coverageYear: "2026",
    }),
    true
  );
  assert.equal(
    matchesPublicArticleSearchFilters(sampleResults[0], {
      classification: "Water",
      journalId: "",
      coverageYear: "",
    }),
    false
  );
});

test("filterPublicArticleSearchResultsWithFilters narrows the applied results", () => {
  const filteredResults = filterPublicArticleSearchResultsWithFilters(
    sampleResults,
    "coastal",
    {
      classification: "Water",
      journalId: "jesam-water",
      coverageYear: "2026",
    }
  );

  assert.deepEqual(filteredResults.map((result) => result.articleId), [
    "article-water",
  ]);
});
