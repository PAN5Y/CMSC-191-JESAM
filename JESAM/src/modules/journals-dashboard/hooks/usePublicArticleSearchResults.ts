import { useCallback, useEffect, useState } from "react";
import { EMPTY_PUBLIC_JOURNAL_FILTERS } from "../search-state";
import { fetchPublicArticleSearchResults } from "../queries/publicSearchResults";
import type {
  PublicArticleSearchResult,
  PublicJournalFilters,
} from "../types";

export function usePublicArticleSearchResults(
  appliedQuery: string,
  enabled: boolean,
  appliedFilters: PublicJournalFilters = EMPTY_PUBLIC_JOURNAL_FILTERS
) {
  const [results, setResults] = useState<PublicArticleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState("");
  const [resolvedFilterKey, setResolvedFilterKey] = useState("");
  const appliedFilterKey = JSON.stringify(appliedFilters);

  const loadResults = useCallback(async () => {
    if (!enabled) {
      setResults([]);
      setError(null);
      setLoading(false);
      setResolvedQuery("");
      setResolvedFilterKey("");
      return;
    }

    setLoading(true);
    setError(null);
    setResolvedQuery("");
    setResolvedFilterKey("");

    try {
      const nextResults = await fetchPublicArticleSearchResults(
        appliedQuery,
        appliedFilters
      );
      setResults(nextResults);
      setResolvedQuery(appliedQuery);
      setResolvedFilterKey(appliedFilterKey);
    } catch (loadError) {
      console.error("Failed to load public search results", loadError);
      setError(
        "The published search results are temporarily unavailable. Please try again."
      );
      setResults([]);
      setResolvedQuery(appliedQuery);
      setResolvedFilterKey(appliedFilterKey);
    } finally {
      setLoading(false);
    }
  }, [appliedFilterKey, appliedFilters, appliedQuery, enabled]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  return {
    results,
    loading:
      enabled &&
      (loading ||
        resolvedQuery !== appliedQuery ||
        resolvedFilterKey !== appliedFilterKey),
    error:
      resolvedQuery === appliedQuery && resolvedFilterKey === appliedFilterKey
        ? error
        : null,
    retry: loadResults,
  };
}
