import { supabase } from "@/lib/supabase";
import type {
  PublicArticleSearchResult,
  PublicJournalFilters,
} from "../types";
import {
  comparePublicArticleSearchResults,
  filterPublicArticleSearchResultsWithFilters,
} from "./publicSearchResultMatchers";
import {
  mapRowsToPublicArticleSearchResults,
  type PublicSearchResultRow,
} from "./publicSearchResultMappers";

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
  ).sort(comparePublicArticleSearchResults);

  return filterPublicArticleSearchResultsWithFilters(
    mappedResults,
    appliedQuery,
    appliedFilters
  ).sort(comparePublicArticleSearchResults);
}
