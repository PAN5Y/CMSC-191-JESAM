import assert from "node:assert/strict";
import test from "node:test";
import {
  buildJournalArticlePreviewSearchDocument,
  filterJournalArticlePreviews,
  matchesJournalArticlePreview,
} from "../../src/modules/journals-dashboard/queries/publicJournalArticlePreviewMatchers.ts";
import type { PublicJournalArticlePreview } from "../../src/modules/journals-dashboard/types.ts";

const samplePreviews: PublicJournalArticlePreview[] = [
  {
    id: "preview-land",
    title: "Soil Carbon Recovery in Upland Landscapes",
    authors: ["Ana Cruz", "Marco Santos"],
    classification: "Land",
    abstractExcerpt:
      "This study evaluates soil carbon recovery, erosion pressure, and upland resilience across agricultural landscapes.",
    publishedAt: "2026-03-12T00:00:00.000Z",
    issueLabel: "Vol. 32 No. 1",
  },
  {
    id: "preview-water",
    title: "Coastal Monitoring for Estuary Restoration",
    authors: ["Lia Ramos", "Paolo Dizon"],
    classification: "Water",
    abstractExcerpt:
      "A coastal monitoring framework for estuary restoration that compares water-quality signals and shoreline pressure.",
    publishedAt: "2026-04-08T00:00:00.000Z",
    issueLabel: "Vol. 32 No. 2",
  },
];

test("buildJournalArticlePreviewSearchDocument includes preview metadata fields", () => {
  const document = buildJournalArticlePreviewSearchDocument(samplePreviews[0]);

  assert.match(document, /soil carbon recovery/);
  assert.match(document, /ana cruz/);
  assert.match(document, /vol\. 32 no\. 1/);
  assert.match(document, /2026/);
});

test("matchesJournalArticlePreview requires every token to appear across the preview search document", () => {
  assert.equal(matchesJournalArticlePreview(samplePreviews[1], "coastal estuary"), true);
  assert.equal(matchesJournalArticlePreview(samplePreviews[1], "coastal governance"), false);
});

test("filterJournalArticlePreviews keeps only matching journal-local previews", () => {
  const filteredPreviews = filterJournalArticlePreviews(samplePreviews, "upland resilience");

  assert.deepEqual(filteredPreviews.map((preview) => preview.id), ["preview-land"]);
});
