import { useCallback, useEffect, useState } from "react";
import { fetchPublicArticleSearchResults } from "../queries/publicSearchResults";
import type {
  PublicArticleSearchResult,
  PublicJournalFilters,
} from "../types";

export function usePublicArticleSearchResults(
  appliedQuery: string,
  enabled: boolean,
  appliedFilters: PublicJournalFilters
) {
  const [results, setResults] = useState<PublicArticleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState("");

  const loadResults = useCallback(async () => {
    if (!enabled) {
      setResults([]);
      setError(null);
      setLoading(false);
      setResolvedQuery("");
      return;
    }

    setLoading(true);
    setError(null);
    setResolvedQuery("");

    try {
      const nextResults = await fetchPublicArticleSearchResults(
        appliedQuery,
        appliedFilters
      );
      setResults(nextResults);
      setResolvedQuery(appliedQuery);
    } catch (loadError) {
      console.error("Failed to load public search results", loadError);
      setError(
        "The published search results are temporarily unavailable. Please try again."
      );
      setResults([]);
      setResolvedQuery(appliedQuery);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, appliedQuery, enabled]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  return {
    results,
    loading: enabled && (loading || resolvedQuery !== appliedQuery),
    error: resolvedQuery === appliedQuery ? error : null,
    retry: loadResults,
  };
}
