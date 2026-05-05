import { usePublicJournals } from "./usePublicJournals";
import { usePublicArticleSearchResults } from "./usePublicArticleSearchResults";
import { useJournalSearchState } from "./useJournalSearchState";
import { filterPublicJournals } from "../search-state";

export function usePublicJournalDiscovery() {
  const publicJournals = usePublicJournals();
  const search = useJournalSearchState();
  const articleSearch = usePublicArticleSearchResults(
    search.appliedQuery,
    search.hasAppliedQuery,
    search.appliedFilters
  );
  const filteredJournals = filterPublicJournals(
    publicJournals.journals,
    search.hasAppliedQuery ? search.appliedQuery : "",
    search.appliedFilters
  );
  const matchingJournals = search.hasAppliedQuery
    ? filteredJournals
    : [];

  return {
    ...search,
    allJournals: publicJournals.journals,
    journals: search.hasAppliedFilters ? filteredJournals : publicJournals.journals,
    journalListingLoading: publicJournals.loading,
    journalListingError: publicJournals.error,
    retryJournalListing: publicJournals.retry,
    articleResults: articleSearch.results,
    articleResultsLoading: articleSearch.loading,
    articleResultsError: articleSearch.error,
    retryArticleResults: articleSearch.retry,
    matchingJournals,
    totalJournals: filteredJournals.length,
    isBrowseMode: !search.hasAppliedQuery,
    hasSearchResults:
      articleSearch.results.length > 0 || matchingJournals.length > 0,
  };
}
