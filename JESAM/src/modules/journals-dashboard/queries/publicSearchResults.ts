import { supabase } from "@/lib/supabase";
import type {
  PublicArticleSearchResult,
  PublicJournalFilters,
} from "../types";
import { derivePublicJournalIdentity } from "./publicJournals";
import {
  comparePublicArticleSearchResults,
  filterPublicArticleSearchResultsWithFilters,
} from "./publicSearchResultMatchers";
import {
  normalizePublicJournalFocusArea,
  sanitizeAuthors,
  toAbstractExcerpt,
} from "./publicSearchShared";

interface PublicSearchResultRow {
  journal_id: string;
  journal_title?: string | null;
  id: string;
  title: string;
  authors: unknown;
  abstract: string | null;
  classification: unknown;
  published_at: string | null;
  issue_assignment: string | null;
}

export function mapRowsToPublicArticleSearchResults(
  rows: PublicSearchResultRow[]
): PublicArticleSearchResult[] {
  return rows
    .map((row) => {
      const classification = normalizePublicJournalFocusArea(row.classification);
      const derivedJournal = derivePublicJournalIdentity(
        row.journal_id,
        classification,
        row.journal_title
      );

      return {
        articleId: row.id,
        title: row.title,
        authors: sanitizeAuthors(row.authors),
        journalId: derivedJournal.id,
        journalTitle: derivedJournal.title,
        classification: classification ?? undefined,
        publishedAt: row.published_at,
        issueLabel: row.issue_assignment,
        abstractExcerpt: toAbstractExcerpt(row.abstract),
      } satisfies PublicArticleSearchResult;
    })
    .sort(comparePublicArticleSearchResults);
}

export async function fetchPublicArticleSearchResults(
  appliedQuery: string,
  appliedFilters: PublicJournalFilters
) {
  const { data, error } = await supabase
    .from("public_journal_article_details")
    .select(
      "journal_id, journal_title, id, title, authors, abstract, classification, published_at, issue_assignment"
    )
    .order("published_at", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    throw new Error("Unable to search published public content at the moment.");
  }

  const mappedResults = mapRowsToPublicArticleSearchResults(
    (data ?? []) as PublicSearchResultRow[]
  );

  return filterPublicArticleSearchResultsWithFilters(
    mappedResults,
    appliedQuery,
    appliedFilters
  ).sort(comparePublicArticleSearchResults);
}
