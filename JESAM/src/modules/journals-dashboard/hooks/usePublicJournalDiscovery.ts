import { usePublicJournals } from "./usePublicJournals";
import { usePublicArticleSearchResults } from "./usePublicArticleSearchResults";
import { useJournalSearchState } from "./useJournalSearchState";
import {
  filterPublicJournals,
} from "../search-state";

export function usePublicJournalDiscovery() {
  const publicJournals = usePublicJournals();
  const search = useJournalSearchState();
  const isResultsMode = search.hasAppliedQuery || search.hasAppliedFilters;
  const matchingJournals = filterPublicJournals(
    publicJournals.journals,
    isResultsMode ? search.appliedQuery : "",
    search.appliedFilters
  );
  const articleResults = usePublicArticleSearchResults(
    search.appliedQuery,
    isResultsMode,
    search.appliedFilters
  );
  const supportingJournalMatchesLoading =
    isResultsMode && publicJournals.loading;
  const supportingJournalMatchesError =
    isResultsMode ? publicJournals.error : null;
  const isBrowseMode = !isResultsMode;

  return {
    ...search,
    allJournals: publicJournals.journals,
    browseJournals: publicJournals.journals,
    matchingJournals: isResultsMode ? matchingJournals : [],
    journalListingLoading: isBrowseMode && publicJournals.loading,
    journalListingError: isBrowseMode ? publicJournals.error : null,
    retryJournalListing: publicJournals.retry,
    articleResults: articleResults.results,
    articleResultsLoading: isResultsMode && articleResults.loading,
    articleResultsError: isResultsMode ? articleResults.error : null,
    retryArticleResults: articleResults.retry,
    totalJournals: publicJournals.journals.length,
    isBrowseMode,
    hasArticleResults: articleResults.results.length > 0,
    hasSupportingJournalMatches: isResultsMode && matchingJournals.length > 0,
    supportingJournalMatchesLoading,
    supportingJournalMatchesError,
  };
}
