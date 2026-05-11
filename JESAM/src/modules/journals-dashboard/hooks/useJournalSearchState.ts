import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { PublicJournalFilters, PublicJournalSearchState } from "../types";
import {
  EMPTY_PUBLIC_JOURNAL_FILTERS,
  hasAppliedPublicJournalFilters,
  normalizePublicJournalFilters,
  PUBLIC_JOURNAL_SEARCHABLE_FIELDS,
  sanitizeJournalSearchQuery,
} from "../search-state";

const SEARCH_QUERY_PARAM = "q";
const FILTER_QUERY_PARAMS = {
  classification: "classification",
  journalId: "journal",
  coverageYear: "year",
} as const;

function resolveAppliedFilters(searchParams: URLSearchParams): PublicJournalFilters {
  return normalizePublicJournalFilters({
    classification:
      (searchParams.get(
        FILTER_QUERY_PARAMS.classification
      ) as PublicJournalFilters["classification"] | null) ?? "",
    journalId: searchParams.get(FILTER_QUERY_PARAMS.journalId) ?? "",
    coverageYear: searchParams.get(FILTER_QUERY_PARAMS.coverageYear) ?? "",
  });
}

function applyFiltersToSearchParams(
  searchParams: URLSearchParams,
  filters: PublicJournalFilters
) {
  const nextSearchParams = new URLSearchParams(searchParams);

  if (filters.classification) {
    nextSearchParams.set(FILTER_QUERY_PARAMS.classification, filters.classification);
  } else {
    nextSearchParams.delete(FILTER_QUERY_PARAMS.classification);
  }

  if (filters.journalId) {
    nextSearchParams.set(FILTER_QUERY_PARAMS.journalId, filters.journalId);
  } else {
    nextSearchParams.delete(FILTER_QUERY_PARAMS.journalId);
  }

  if (filters.coverageYear) {
    nextSearchParams.set(FILTER_QUERY_PARAMS.coverageYear, filters.coverageYear);
  } else {
    nextSearchParams.delete(FILTER_QUERY_PARAMS.coverageYear);
  }

  return nextSearchParams;
}

export function useJournalSearchState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resolvedAppliedQuery = sanitizeJournalSearchQuery(
    searchParams.get(SEARCH_QUERY_PARAM) ?? ""
  );
  const resolvedAppliedFilters = resolveAppliedFilters(searchParams);
  const [appliedQuery, setAppliedQuery] = useState(resolvedAppliedQuery);
  const [appliedFilters, setAppliedFilters] = useState(resolvedAppliedFilters);
  const [draftQuery, setDraftQuery] = useState(resolvedAppliedQuery);
  const [draftFilters, setDraftFilters] = useState(resolvedAppliedFilters);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    setAppliedQuery(resolvedAppliedQuery);
  }, [resolvedAppliedQuery]);

  useEffect(() => {
    setAppliedFilters(resolvedAppliedFilters);
  }, [
    resolvedAppliedFilters.classification,
    resolvedAppliedFilters.coverageYear,
    resolvedAppliedFilters.journalId,
  ]);

  useEffect(() => {
    setDraftQuery(appliedQuery);
  }, [appliedQuery]);

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [
    appliedFilters.classification,
    appliedFilters.coverageYear,
    appliedFilters.journalId,
  ]);

  const commitDraftSearchState = ({
    requireQueryWhenNoFilters,
  }: {
    requireQueryWhenNoFilters: boolean;
  }) => {
    const nextQuery = sanitizeJournalSearchQuery(draftQuery);
    const normalizedDraftFilters = normalizePublicJournalFilters(draftFilters);
    const hasDraftFilters = hasAppliedPublicJournalFilters(normalizedDraftFilters);
    const hadAppliedQuery = appliedQuery.length > 0;
    const hadAppliedFilters = hasAppliedPublicJournalFilters(appliedFilters);
    const nextSearchParams = new URLSearchParams(searchParams);

    if (!nextQuery && requireQueryWhenNoFilters && !hasDraftFilters) {
      const nextSearchParamsWithClearedFilters = applyFiltersToSearchParams(
        nextSearchParams,
        EMPTY_PUBLIC_JOURNAL_FILTERS
      );

      nextSearchParamsWithClearedFilters.delete(SEARCH_QUERY_PARAM);
      setAppliedQuery("");
      setAppliedFilters(EMPTY_PUBLIC_JOURNAL_FILTERS);
      setSearchParams(nextSearchParamsWithClearedFilters);
      setValidationMessage(
        hadAppliedQuery || hadAppliedFilters
          ? null
          : "Enter a topic, author, journal title, issue detail, or year to begin."
      );
      return;
    }

    if (nextQuery) {
      nextSearchParams.set(SEARCH_QUERY_PARAM, nextQuery);
    } else {
      nextSearchParams.delete(SEARCH_QUERY_PARAM);
    }

    const nextSearchParamsWithFilters = applyFiltersToSearchParams(
      nextSearchParams,
      normalizedDraftFilters
    );

    setAppliedQuery(nextQuery);
    setAppliedFilters(normalizedDraftFilters);
    setSearchParams(nextSearchParamsWithFilters);
    setValidationMessage(null);
  };

  const submitSearch = () => {
    commitDraftSearchState({ requireQueryWhenNoFilters: true });
  };

  const clearSearch = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(SEARCH_QUERY_PARAM);
    setAppliedQuery("");
    setSearchParams(nextSearchParams);
    setDraftQuery("");
    setValidationMessage(null);
  };

  const updateDraftFilter = <K extends keyof PublicJournalFilters>(
    key: K,
    value: PublicJournalFilters[K]
  ) => {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    commitDraftSearchState({ requireQueryWhenNoFilters: false });
  };

  const clearFilters = () => {
    const nextSearchParams = applyFiltersToSearchParams(
      searchParams,
      EMPTY_PUBLIC_JOURNAL_FILTERS
    );

    setAppliedFilters(EMPTY_PUBLIC_JOURNAL_FILTERS);
    setSearchParams(nextSearchParams);
    setDraftFilters(EMPTY_PUBLIC_JOURNAL_FILTERS);
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
    draftFilters,
    appliedFilters,
    hasAppliedFilters: hasAppliedPublicJournalFilters(appliedFilters),
    validationMessage,
    searchableFields: PUBLIC_JOURNAL_SEARCHABLE_FIELDS,
    updateDraftQuery,
    updateDraftFilter,
    submitSearch,
    clearSearch,
    applyFilters,
    clearFilters,
  } satisfies PublicJournalSearchState & {
    updateDraftQuery: (value: string) => void;
    updateDraftFilter: <K extends keyof PublicJournalFilters>(
      key: K,
      value: PublicJournalFilters[K]
    ) => void;
    submitSearch: () => void;
    clearSearch: () => void;
    applyFilters: () => void;
    clearFilters: () => void;
  };
}
