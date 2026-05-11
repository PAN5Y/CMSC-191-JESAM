import { useCallback, useEffect, useState } from "react";
import { fetchPublicJournals } from "../queries/publicJournals";
import type { PublicJournalListItem } from "../types";

export function usePublicJournals() {
  const [journals, setJournals] = useState<PublicJournalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJournals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const publicJournals = await fetchPublicJournals();
      setJournals(publicJournals);
    } catch (loadError) {
      console.error("Failed to load public journals", loadError);
      setError(
        "The public journal listing is temporarily unavailable. Please try again."
      );
      setJournals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  return {
    journals,
    loading,
    error,
    retry: loadJournals,
  };
}
