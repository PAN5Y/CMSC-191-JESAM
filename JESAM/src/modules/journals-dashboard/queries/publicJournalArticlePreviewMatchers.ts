import { tokenizeJournalSearchQuery } from "../search-state.ts";
import type { PublicJournalArticlePreview } from "../types.ts";

function normalizeSearchText(value: string) {
  return value.toLowerCase().trim();
}

function getPublishedYear(publishedAt: string | null) {
  if (!publishedAt) {
    return "";
  }

  const year = new Date(publishedAt).getUTCFullYear();
  return Number.isNaN(year) ? "" : String(year);
}

export function buildJournalArticlePreviewSearchDocument(
  articlePreview: PublicJournalArticlePreview
) {
  return normalizeSearchText(
    [
      articlePreview.title,
      articlePreview.abstractExcerpt,
      articlePreview.classification,
      articlePreview.issueLabel,
      getPublishedYear(articlePreview.publishedAt),
      ...articlePreview.authors,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function matchesJournalArticlePreview(
  articlePreview: PublicJournalArticlePreview,
  appliedQuery: string
) {
  const queryTokens = tokenizeJournalSearchQuery(appliedQuery);

  if (queryTokens.length === 0) {
    return true;
  }

  const searchDocument = buildJournalArticlePreviewSearchDocument(articlePreview);
  return queryTokens.every((token) => searchDocument.includes(token));
}

export function filterJournalArticlePreviews(
  articlePreviews: PublicJournalArticlePreview[],
  appliedQuery: string
) {
  return articlePreviews.filter((articlePreview) =>
    matchesJournalArticlePreview(articlePreview, appliedQuery)
  );
}
