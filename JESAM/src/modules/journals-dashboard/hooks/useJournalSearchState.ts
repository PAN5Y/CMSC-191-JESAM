import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type {
  PublicJournalFilters,
  PublicJournalSearchState,
} from "../types";
import {
  EMPTY_PUBLIC_JOURNAL_FILTERS,
  hasAppliedPublicJournalFilters,
  normalizePublicJournalFilters,
  PUBLIC_JOURNAL_SEARCHABLE_FIELDS,
  sanitizeJournalSearchQuery,
} from "../search-state";

const SEARCH_QUERY_PARAM = "q";
const FILTER_CLASSIFICATION_PARAM = "classification";
const FILTER_JOURNAL_PARAM = "journal";
const FILTER_YEAR_PARAM = "year";

function getAppliedFilters(searchParams: URLSearchParams): PublicJournalFilters {
  return normalizePublicJournalFilters({
    classification:
      (searchParams.get(FILTER_CLASSIFICATION_PARAM) ?? "") as PublicJournalFilters["classification"],
    journalId: searchParams.get(FILTER_JOURNAL_PARAM) ?? "",
    coverageYear: searchParams.get(FILTER_YEAR_PARAM) ?? "",
  });
}

export function useJournalSearchState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedQuery = sanitizeJournalSearchQuery(
    searchParams.get(SEARCH_QUERY_PARAM) ?? ""
  );
  const appliedFilters = getAppliedFilters(searchParams);
  const [draftQuery, setDraftQuery] = useState(appliedQuery);
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftQuery(appliedQuery);
  }, [appliedQuery]);

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFilters]);

  const submitSearch = () => {
    const nextQuery = sanitizeJournalSearchQuery(draftQuery);
    const normalizedFilters = normalizePublicJournalFilters(draftFilters);
    const hasDraftFilters = hasAppliedPublicJournalFilters(normalizedFilters);

    if (!nextQuery && !hasDraftFilters) {
      setValidationMessage(
        "Enter a topic, journal theme, keyword, or choose filters to begin."
      );
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextQuery) {
      nextSearchParams.set(SEARCH_QUERY_PARAM, nextQuery);
    } else {
      nextSearchParams.delete(SEARCH_QUERY_PARAM);
    }

    if (normalizedFilters.classification) {
      nextSearchParams.set(
        FILTER_CLASSIFICATION_PARAM,
        normalizedFilters.classification
      );
    } else {
      nextSearchParams.delete(FILTER_CLASSIFICATION_PARAM);
    }

    if (normalizedFilters.journalId) {
      nextSearchParams.set(FILTER_JOURNAL_PARAM, normalizedFilters.journalId);
    } else {
      nextSearchParams.delete(FILTER_JOURNAL_PARAM);
    }

    if (normalizedFilters.coverageYear) {
      nextSearchParams.set(FILTER_YEAR_PARAM, normalizedFilters.coverageYear);
    } else {
      nextSearchParams.delete(FILTER_YEAR_PARAM);
    }

    setSearchParams(nextSearchParams);
    setValidationMessage(null);
  };

  const clearSearch = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(SEARCH_QUERY_PARAM);
    setSearchParams(nextSearchParams);
    setDraftQuery("");
    setValidationMessage(null);
  };

  const updateDraftQuery = (value: string) => {
    setDraftQuery(value);

    if (validationMessage) {
      setValidationMessage(null);
    }
  };

  const updateDraftFilter = <K extends keyof PublicJournalFilters>(
    key: K,
    value: PublicJournalFilters[K]
  ) => {
    setDraftFilters((currentFilters) =>
      normalizePublicJournalFilters({
        ...currentFilters,
        [key]: value,
      })
    );
  };

  const clearFilters = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(FILTER_CLASSIFICATION_PARAM);
    nextSearchParams.delete(FILTER_JOURNAL_PARAM);
    nextSearchParams.delete(FILTER_YEAR_PARAM);
    setSearchParams(nextSearchParams);
    setDraftFilters(EMPTY_PUBLIC_JOURNAL_FILTERS);
  };

  return {
    draftQuery,
    appliedQuery,
    hasAppliedQuery: appliedQuery.length > 0,
    draftFilters,
    appliedFilters,
    hasAppliedFilters: hasAppliedPublicJournalFilters(appliedFilters),
    validationMessage,
    searchableFields: PUBLIC_JOURNAL_SEARCHABLE_FIELDS,
    updateDraftQuery,
    updateDraftFilter,
    submitSearch,
    clearSearch,
    clearFilters,
  } satisfies PublicJournalSearchState & {
    updateDraftQuery: (value: string) => void;
    updateDraftFilter: <K extends keyof PublicJournalFilters>(
      key: K,
      value: PublicJournalFilters[K]
    ) => void;
    submitSearch: () => void;
    clearSearch: () => void;
    clearFilters: () => void;
  };
}
