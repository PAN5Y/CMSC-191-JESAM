import { useMemo } from "react";
import { Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ArticleSearchResultCard from "../components/ArticleSearchResultCard";
import JournalFilterRail from "../components/JournalFilterRail";
import JournalListCard from "../components/JournalListCard";
import JournalMatchCard from "../components/JournalMatchCard";
import JournalSearchPanel from "../components/JournalSearchPanel";
import PublicJournalsShell from "../components/PublicJournalsShell";
import { PublicRecoveryState } from "../components/PublicRecoveryState";
import { usePublicJournalDiscovery } from "../hooks/usePublicJournalDiscovery";
import { getPublicRecoveryCopy } from "../queries/publicRecoveryState";
import { PUBLIC_JOURNAL_FOCUS_AREAS } from "../search-state";

export default function JournalsDashboardPage() {
  const {
    allJournals,
    browseJournals,
    matchingJournals,
    journalListingLoading,
    journalListingError,
    retryJournalListing,
    draftQuery,
    appliedQuery,
    hasAppliedQuery,
    draftFilters,
    appliedFilters,
    hasAppliedFilters,
    updateDraftQuery,
    updateDraftFilter,
    submitSearch,
    clearSearch,
    applyFilters,
    clearFilters,
    validationMessage,
    articleResults,
    articleResultsLoading,
    articleResultsError,
    retryArticleResults,
    hasArticleResults,
    hasSupportingJournalMatches,
    supportingJournalMatchesLoading,
    supportingJournalMatchesError,
    isBrowseMode,
  } = usePublicJournalDiscovery();

  const activeSearchParams = new URLSearchParams();

  if (appliedQuery) {
    activeSearchParams.set("q", appliedQuery);
  }

  if (appliedFilters.classification) {
    activeSearchParams.set("classification", appliedFilters.classification);
  }

  if (appliedFilters.journalId) {
    activeSearchParams.set("journal", appliedFilters.journalId);
  }

  if (appliedFilters.coverageYear) {
    activeSearchParams.set("year", appliedFilters.coverageYear);
  }

  const returnTo =
    activeSearchParams.size > 0
      ? `/journals?${activeSearchParams.toString()}`
      : "/journals";

  const listingRecoveryCopy = getPublicRecoveryCopy("journal-listing");
  const articleRecoveryCopy = getPublicRecoveryCopy("article-search");
  const hasActiveRefinement = hasAppliedQuery || hasAppliedFilters;
  const resultsHeading = hasAppliedQuery
    ? `Results for "${appliedQuery}"`
    : hasAppliedFilters
      ? "Filtered results"
      : "Browse journals";
  const resultsCount = hasActiveRefinement
    ? `${articleResults.length} papers${
        hasSupportingJournalMatches ? ` | ${matchingJournals.length} journals` : ""
      }`
    : `${browseJournals.length} journals`;
  const hasAnySearchMatches =
    hasArticleResults ||
    hasSupportingJournalMatches ||
    supportingJournalMatchesLoading ||
    Boolean(supportingJournalMatchesError);

  const availableYears = useMemo(
    () =>
      Array.from(
        new Set(
          allJournals.flatMap((journal) =>
            journal.coverageYears.map((year) => year.toString())
          )
        )
      ).sort((left, right) => Number(right) - Number(left)),
    [allJournals]
  );

  return (
    <PublicJournalsShell>
      <section className="relative overflow-hidden rounded-[2rem] border border-[#d9deec] bg-[linear-gradient(135deg,#1f2a52_0%,#31427a_48%,#d7c4a3_160%)] px-7 py-8 text-white shadow-[0_24px_80px_rgba(36,49,95,0.16)] lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_58%)]" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

        <div className="relative max-w-4xl space-y-4">
          <Badge className="w-fit border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
            Public journals archive
          </Badge>
          <h1 className="font-['Newsreader',serif] text-4xl leading-tight text-white sm:text-5xl lg:text-[3.45rem]">
            Search published JESAM papers through journal-based discovery.
          </h1>
          <p className="max-w-3xl font-['Public_Sans',sans-serif] text-base leading-7 text-slate-100/88 sm:text-lg">
            Start with a topic, author, or publication clue, then refine the
            archive deliberately before you open the paper or journal that best
            fits your research path.
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:gap-6 lg:grid-cols-[14.5rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <JournalFilterRail
          draftFilters={draftFilters}
          appliedFilters={appliedFilters}
          hasAppliedFilters={hasAppliedFilters}
          availableJournals={allJournals}
          availableYears={availableYears}
          availableFocusAreas={PUBLIC_JOURNAL_FOCUS_AREAS}
          onDraftFilterChange={updateDraftFilter}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
        />

        <div className="space-y-6">
          <JournalSearchPanel
            draftQuery={draftQuery}
            hasAppliedQuery={hasAppliedQuery}
            validationMessage={validationMessage}
            onDraftQueryChange={updateDraftQuery}
            onSubmitSearch={submitSearch}
            onClearSearch={clearSearch}
          />

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="font-['Public_Sans',sans-serif] text-sm font-medium uppercase tracking-[0.16em] text-[#6a5a3d]">
                {hasActiveRefinement ? "Search results" : "Journal archive"}
              </p>
              <h2 className="font-['Newsreader',serif] text-3xl text-[#1d2548]">
                {resultsHeading}
              </h2>
            </div>
            <Badge
              variant="outline"
              className="border-[#d8d3c7] bg-[#fbf6ec] px-3 py-1 text-[#5f4d31]"
            >
              {resultsCount}
            </Badge>
          </div>

          {hasAppliedFilters ? (
            <Card className="border-[#ddd3c1] bg-[linear-gradient(180deg,#fffdf9,#f4ecdd)] shadow-sm">
              <CardContent className="flex flex-wrap items-center gap-3 px-5 py-4">
                <p className="font-['Public_Sans',sans-serif] text-sm text-[#5f4d31]">
                  Active filters:
                </p>
                {appliedFilters.classification ? (
                  <Badge className="bg-white text-[#5f4d31] hover:bg-white">
                    Topic area: {appliedFilters.classification}
                  </Badge>
                ) : null}
                {appliedFilters.journalId ? (
                  <Badge className="bg-white text-[#5f4d31] hover:bg-white">
                    Journal:{" "}
                    {allJournals.find((journal) => journal.id === appliedFilters.journalId)
                      ?.title ?? appliedFilters.journalId}
                  </Badge>
                ) : null}
                {appliedFilters.coverageYear ? (
                  <Badge className="bg-white text-[#5f4d31] hover:bg-white">
                    Coverage year: {appliedFilters.coverageYear}
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {isBrowseMode && journalListingLoading ? (
            <Card className="border-[#d8deef] bg-white/85 shadow-[0_18px_50px_rgba(36,49,95,0.08)]">
              <CardContent className="flex flex-col gap-4 px-6 py-8">
                <div className="flex items-center gap-3 text-[#24315f]">
                  <Sparkles className="size-4 animate-pulse" />
                  <p className="font-['Public_Sans',sans-serif] text-sm">
                    Loading published journals...
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="h-24 rounded-2xl bg-[linear-gradient(135deg,#eef1fb,#f6efe1)]" />
                  <div className="h-24 rounded-2xl bg-[linear-gradient(135deg,#eef1fb,#f6efe1)]" />
                  <div className="h-24 rounded-2xl bg-[linear-gradient(135deg,#eef1fb,#f6efe1)]" />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {isBrowseMode && !journalListingLoading && journalListingError ? (
            <PublicRecoveryState
              title={listingRecoveryCopy.title}
              description={listingRecoveryCopy.description}
              primaryActionLabel={listingRecoveryCopy.primaryActionLabel}
              onPrimaryAction={retryJournalListing}
            />
          ) : null}

          {!isBrowseMode && articleResultsLoading ? (
            <Card className="border-[#d8deef] bg-white/85 shadow-[0_18px_50px_rgba(36,49,95,0.08)]">
              <CardContent className="flex flex-col gap-4 px-6 py-8">
                <div className="flex items-center gap-3 text-[#24315f]">
                  <Sparkles className="size-4 animate-pulse" />
                  <p className="font-['Public_Sans',sans-serif] text-sm">
                    {hasAppliedQuery
                      ? `Searching published papers for "${appliedQuery}"...`
                      : "Applying filters to published papers..."}
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,#eef1fb,#f6efe1)]" />
                  <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,#eef1fb,#f6efe1)]" />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!isBrowseMode && !articleResultsLoading && articleResultsError ? (
            <PublicRecoveryState
              title={articleRecoveryCopy.title}
              description={articleRecoveryCopy.description}
              primaryActionLabel={articleRecoveryCopy.primaryActionLabel}
              onPrimaryAction={retryArticleResults}
              secondaryActionLabel={
                hasAppliedFilters ? "Clear Filters" : "Return to Browse"
              }
              onSecondaryAction={hasAppliedFilters ? clearFilters : clearSearch}
            />
          ) : null}

          {!isBrowseMode &&
          !articleResultsLoading &&
          !articleResultsError &&
          supportingJournalMatchesLoading ? (
            <Card className="border-[#d8deef] bg-white/85 shadow-[0_18px_50px_rgba(36,49,95,0.08)]">
              <CardContent className="flex flex-col gap-4 px-6 py-8">
                <div className="flex items-center gap-3 text-[#24315f]">
                  <Sparkles className="size-4 animate-pulse" />
                  <p className="font-['Public_Sans',sans-serif] text-sm">
                    Loading related journal collections...
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="h-24 rounded-2xl bg-[linear-gradient(135deg,#eef1fb,#f6efe1)]" />
                  <div className="h-24 rounded-2xl bg-[linear-gradient(135deg,#eef1fb,#f6efe1)]" />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!isBrowseMode &&
          !articleResultsLoading &&
          !articleResultsError &&
          !supportingJournalMatchesLoading &&
          supportingJournalMatchesError ? (
            <PublicRecoveryState
              title={listingRecoveryCopy.title}
              description={listingRecoveryCopy.description}
              primaryActionLabel={listingRecoveryCopy.primaryActionLabel}
              onPrimaryAction={retryJournalListing}
              secondaryActionLabel={hasAppliedFilters ? "Clear Filters" : "Clear Search"}
              onSecondaryAction={hasAppliedFilters ? clearFilters : clearSearch}
            />
          ) : null}

          {!isBrowseMode &&
          !articleResultsLoading &&
          !articleResultsError &&
          !supportingJournalMatchesLoading &&
          !supportingJournalMatchesError &&
          !hasAnySearchMatches ? (
            <Card className="border-[#d8deef] bg-[linear-gradient(180deg,#ffffff,#fbf6ec)] shadow-sm">
              <CardContent className="space-y-4 px-6 py-8">
                <div className="flex items-center gap-3 text-[#24315f]">
                  <Search className="size-4" />
                  <p className="font-['Public_Sans',sans-serif] text-sm">
                    {hasAppliedQuery
                      ? `No matching published papers or journal collections were found for "${appliedQuery}".`
                      : "No matching published papers or journal collections were found for the current filters."}
                  </p>
                </div>
                <p className="max-w-2xl font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                  {hasAppliedFilters
                    ? "Try a broader topic area, another journal, a different coverage year, or clear the filters to return to the broader archive."
                    : "Try a broader topic, another author name, a journal title, or clear the search to return to the full archive."}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={hasAppliedFilters ? clearFilters : clearSearch}
                    className="border-[#cfd8ef] text-[#24315f]"
                  >
                    {hasAppliedFilters ? "Clear Filters" : "Clear Search"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!isBrowseMode &&
          !articleResultsLoading &&
          !articleResultsError &&
          hasArticleResults ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="font-['Public_Sans',sans-serif] text-sm font-medium uppercase tracking-[0.16em] text-[#6a5a3d]">
                  Published paper matches
                </p>
                <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                  Each result shows enough journal and publication context for
                  quick academic scanning before you open the full paper page.
                </p>
              </div>
              <div className="grid gap-5">
                {articleResults.map((result) => (
                  <ArticleSearchResultCard
                    key={result.articleId}
                    result={result}
                    returnTo={returnTo}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {!isBrowseMode &&
          !articleResultsLoading &&
          !articleResultsError &&
          hasSupportingJournalMatches ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="font-['Public_Sans',sans-serif] text-sm font-medium uppercase tracking-[0.16em] text-[#6a5a3d]">
                  Related journal collections
                </p>
                <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                  {hasArticleResults
                    ? "Open a journal when you want broader collection context around the topic before selecting a specific paper."
                    : "No published papers matched directly, but these journal collections still align with the topic and can help you continue browsing."}
                </p>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                {matchingJournals.map((journal) => (
                  <JournalMatchCard
                    key={journal.id}
                    journal={journal}
                    returnTo={returnTo}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {isBrowseMode &&
          !journalListingLoading &&
          !journalListingError &&
          browseJournals.length === 0 ? (
            <Card className="border-[#d8deef] bg-[linear-gradient(180deg,#ffffff,#fbf6ec)] shadow-sm">
              <CardContent className="space-y-3 px-6 py-8">
                <h3 className="font-['Newsreader',serif] text-2xl text-[#24315f]">
                  No public journals are available yet
                </h3>
                <p className="max-w-2xl font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                  This archive is ready for public discovery, but there are no
                  published journal records to show at the moment.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {isBrowseMode &&
          !journalListingLoading &&
          !journalListingError &&
          browseJournals.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-5">
                {browseJournals.map((journal) => (
                  <JournalListCard
                    key={journal.id}
                    journal={journal}
                    returnTo={returnTo}
                    returnLabel="Back to Journals"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </PublicJournalsShell>
  );
}
