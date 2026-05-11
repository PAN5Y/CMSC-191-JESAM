import { useEffect, useMemo, useState } from "react";
import { sanitizeJournalSearchQuery } from "../search-state";
import { filterJournalArticlePreviews } from "../queries/publicJournalArticlePreviewMatchers";
import type { PublicJournalArticlePreview } from "../types";

interface JournalArticlePreviewSearchOptions {
  resetKey?: string;
  initialQuery?: string;
}

export function useJournalArticlePreviewSearch(
  articlePreviews: PublicJournalArticlePreview[],
  options: JournalArticlePreviewSearchOptions = {}
) {
  const normalizedInitialQuery = sanitizeJournalSearchQuery(
    options.initialQuery ?? ""
  );
  const [draftQuery, setDraftQuery] = useState(normalizedInitialQuery);
  const [appliedQuery, setAppliedQuery] = useState(normalizedInitialQuery);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const matchingPreviews = useMemo(
    () => filterJournalArticlePreviews(articlePreviews, appliedQuery),
    [appliedQuery, articlePreviews]
  );

  useEffect(() => {
    setDraftQuery(normalizedInitialQuery);
    setAppliedQuery(normalizedInitialQuery);
    setValidationMessage(null);
  }, [normalizedInitialQuery, options.resetKey]);

  const submitSearch = () => {
    const nextQuery = sanitizeJournalSearchQuery(draftQuery);

    if (!nextQuery) {
      setValidationMessage("Enter a keyword, author, topic, year, or issue label.");
      return;
    }

    setAppliedQuery(nextQuery);
    setValidationMessage(null);
  };

  const clearSearch = () => {
    setDraftQuery("");
    setAppliedQuery("");
    setValidationMessage(null);
  };

  const updateDraftQuery = (value: string) => {
    setDraftQuery(value);

    if (validationMessage) {
      setValidationMessage(null);
    }
  };

  return {
    draftQuery,
    appliedQuery,
    hasAppliedQuery: appliedQuery.length > 0,
    matchingPreviews: appliedQuery ? matchingPreviews : articlePreviews,
    validationMessage,
    updateDraftQuery,
    submitSearch,
    clearSearch,
  };
}
