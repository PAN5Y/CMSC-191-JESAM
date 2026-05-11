import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPublicArticleAssistantContext,
  buildPublicArticleAssistantShortcuts,
} from "../../src/modules/journals-dashboard/queries/publicArticleAssistantContext.ts";
import type { PublicArticleDetail } from "../../src/modules/journals-dashboard/types.ts";

const article: PublicArticleDetail = {
  id: "article-1",
  journalId: "jesam-water",
  journalTitle: "JESAM Water and Coastal Research",
  title: "Watershed resilience pathways",
  authors: ["A. Rivera", "B. Cruz"],
  abstract: "This abstract describes watershed resilience and restoration work.",
  summary: "This summary highlights the article's main findings.",
  classification: "Water",
  publishedAt: "2026-04-01",
  issueLabel: "Vol. 12 No. 1",
  doi: "10.1234/example",
  keywords: ["watershed", "resilience", "restoration"],
  downloadAvailabilityStatus: "available",
  isDownloadable: true,
  downloadUrl: "https://example.com/article.pdf",
};

test("buildPublicArticleAssistantContext includes only public-safe article fields", () => {
  const context = buildPublicArticleAssistantContext(article);

  assert.match(context, /Article title: Watershed resilience pathways/);
  assert.match(context, /Journal: JESAM Water and Coastal Research/);
  assert.match(context, /Keywords: watershed, resilience, restoration/);
  assert.match(context, /Summary: This summary highlights the article's main findings\./);
  assert.doesNotMatch(context, /downloadUrl/i);
  assert.doesNotMatch(context, /workflow state/i);
});

test("buildPublicArticleAssistantContext omits optional lines when fields are absent", () => {
  const minimalContext = buildPublicArticleAssistantContext({
    ...article,
    summary: undefined,
    doi: undefined,
    issueLabel: null,
  });

  assert.doesNotMatch(minimalContext, /Summary:/);
  assert.doesNotMatch(minimalContext, /DOI:/);
  assert.doesNotMatch(minimalContext, /Publication details:/);
});

test("buildPublicArticleAssistantShortcuts includes a related-papers shortcut", () => {
  const shortcuts = buildPublicArticleAssistantShortcuts(article);

  assert.equal(shortcuts.length, 3);
  assert.equal(shortcuts[2].label, "Related JESAM papers");
  assert.match(shortcuts[2].prompt, /watershed, resilience, restoration/i);
});
