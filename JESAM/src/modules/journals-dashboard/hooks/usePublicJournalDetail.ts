import { useCallback, useEffect, useState } from "react";
import { fetchPublicJournalDetail } from "../queries/publicJournalDetail";
import type { PublicJournalDetail } from "../types";

export function usePublicJournalDetail(journalId?: string) {
  const [journalDetail, setJournalDetail] = useState<PublicJournalDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadJournalDetail = useCallback(async () => {
    if (!journalId) {
      setJournalDetail(null);
      setNotFound(true);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const detail = await fetchPublicJournalDetail(journalId);

      if (!detail) {
        setJournalDetail(null);
        setNotFound(true);
        return;
      }

      setJournalDetail(detail);
    } catch (loadError) {
      console.error("Failed to load public journal detail", loadError);
      setError(
        "The journal detail is temporarily unavailable. Please try again."
      );
      setJournalDetail(null);
    } finally {
      setLoading(false);
    }
  }, [journalId]);

  useEffect(() => {
    loadJournalDetail();
  }, [loadJournalDetail]);

  return {
    journalDetail,
    loading,
    error,
    notFound,
    retry: loadJournalDetail,
  };
}
