import { useCallback, useEffect, useState } from "react";
import { fetchPublicArticleDetail } from "../queries/publicArticleDetail";
import type { PublicArticleDetail } from "../types";

export function usePublicArticleDetail(articleId?: string) {
  const [articleDetail, setArticleDetail] = useState<PublicArticleDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadArticleDetail = useCallback(async () => {
    if (!articleId) {
      setArticleDetail(null);
      setNotFound(true);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const detail = await fetchPublicArticleDetail(articleId);

      if (!detail) {
        setArticleDetail(null);
        setNotFound(true);
        return;
      }

      setArticleDetail(detail);
    } catch (loadError) {
      console.error("Failed to load public article detail", loadError);
      setError(
        "The article detail is temporarily unavailable. Please try again."
      );
      setArticleDetail(null);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadArticleDetail();
  }, [loadArticleDetail]);

  return {
    articleDetail,
    loading,
    error,
    notFound,
    retry: loadArticleDetail,
  };
}
