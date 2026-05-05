import { tokenizeJournalSearchQuery } from "../search-state.ts";
import type {
  PublicArticleSearchResult,
  PublicJournalFilters,
} from "../types.ts";

function normalizeSearchText(value: string) {
  return value.toLowerCase().trim();
}

export function comparePublicArticleSearchResults(
  left: PublicArticleSearchResult,
  right: PublicArticleSearchResult
) {
  const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : Number.NaN;
  const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : Number.NaN;

  if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime) && leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  if (Number.isNaN(leftTime) !== Number.isNaN(rightTime)) {
    return Number.isNaN(leftTime) ? 1 : -1;
  }

  return left.title.localeCompare(right.title);
}

export function buildPublicArticleSearchDocument(
  result: PublicArticleSearchResult
) {
  return normalizeSearchText(
    [
      result.title,
      result.journalTitle,
      result.issueLabel,
      result.classification,
      result.abstractExcerpt,
      ...result.authors,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function matchesPublicArticleSearchResult(
  result: PublicArticleSearchResult,
  appliedQuery: string
) {
  const queryTokens = tokenizeJournalSearchQuery(appliedQuery);

  if (queryTokens.length === 0) {
    return true;
  }

  const searchDocument = buildPublicArticleSearchDocument(result);
  return queryTokens.every((token) => searchDocument.includes(token));
}

export function filterPublicArticleSearchResults(
  results: PublicArticleSearchResult[],
  appliedQuery: string
) {
  return results.filter((result) =>
    matchesPublicArticleSearchResult(result, appliedQuery)
  );
}

export function matchesPublicArticleSearchFilters(
  result: PublicArticleSearchResult,
  filters: PublicJournalFilters
) {
  if (filters.classification && result.classification !== filters.classification) {
    return false;
  }

  if (filters.journalId && result.journalId !== filters.journalId) {
    return false;
  }

  if (filters.coverageYear) {
    const publishedYear = result.publishedAt
      ? new Date(result.publishedAt).getFullYear().toString()
      : "";

    if (publishedYear !== filters.coverageYear) {
      return false;
    }
  }

  return true;
}

export function filterPublicArticleSearchResultsWithFilters(
  results: PublicArticleSearchResult[],
  appliedQuery: string,
  filters: PublicJournalFilters
) {
  return filterPublicArticleSearchResults(results, appliedQuery).filter((result) =>
    matchesPublicArticleSearchFilters(result, filters)
  );
}
