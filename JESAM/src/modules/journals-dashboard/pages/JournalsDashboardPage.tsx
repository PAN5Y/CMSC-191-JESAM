import {
  AlertCircle,
  BookOpen,
  Leaf,
  Compass,
  Search,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ArticleSearchResultCard from "../components/ArticleSearchResultCard";
import JournalMatchCard from "../components/JournalMatchCard";
import JournalSearchPanel from "../components/JournalSearchPanel";
import JournalListCard from "../components/JournalListCard";
import { usePublicJournalDiscovery } from "../hooks/usePublicJournalDiscovery";
import { PUBLIC_JOURNAL_FOCUS_AREAS } from "../search-state";

const featurePanels = [
  {
    icon: Search,
    title: "Focused Search",
    description:
      "Keep the search anchored near the results so you can refine a topic without losing your place in the list.",
    tone:
      "border-[#d7dff2] bg-[linear-gradient(180deg,#ffffff,#eef3ff)]",
  },
  {
    icon: BookOpen,
    title: "Browse by Journal",
    description:
      "Move from a paper match into its journal when you want a broader view of related published work.",
    tone:
      "border-[#e0d7c4] bg-[linear-gradient(180deg,#fffdf8,#f4ecdd)]",
  },
  {
    icon: Compass,
    title: "Clear Next Steps",
    description:
      "Each page makes it obvious whether you are opening one paper, scanning a journal, or returning to your search.",
    tone:
      "border-[#d9dce9] bg-[linear-gradient(180deg,#ffffff,#f5f4fb)]",
  },
];

export default function JournalsDashboardPage() {
  const {
    journals,
    allJournals,
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
    clearFilters,
    clearSearch,
    validationMessage,
    articleResults,
    articleResultsLoading,
    articleResultsError,
    retryArticleResults,
    matchingJournals,
    hasSearchResults,
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

  const returnTo = activeSearchParams.size > 0
    ? `/journals?${activeSearchParams.toString()}`
    : "/journals";
  const availableYears = Array.from(
    new Set(allJournals.flatMap((journal) => journal.coverageYears.map(String)))
  ).sort((left, right) => Number(right) - Number(left));
  const resultsLabel = hasAppliedQuery
    ? "Search Results"
    : hasAppliedFilters
      ? "Filtered Journal List"
      : "Journal List";
  const resultsHeading = hasAppliedQuery
    ? "Results for your search"
    : hasAppliedFilters
      ? "Journals matching your applied filters"
      : "Published journals you can browse";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef2fb_0%,#f4efe8_20%,#f7f8fc_54%,#fbfbfd_100%)] text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-[#d8deef] bg-[linear-gradient(135deg,#24315f,#51639a)] text-white shadow-[0_12px_28px_rgba(36,49,95,0.18)]">
              <Leaf className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-['Newsreader',serif] text-2xl tracking-tight text-[#24315f]">
                  JESAM Journals
                </p>
                <Badge
                  variant="outline"
                  className="border-[#dccfb8] bg-[#fffaf0] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#6a5a3d]"
                >
                  Placeholder mark
                </Badge>
              </div>
              <p className="font-['Public_Sans',sans-serif] text-sm text-slate-600">
                Public research discovery portal
              </p>
            </div>
          </div>
          <p className="hidden max-w-sm text-right font-['Public_Sans',sans-serif] text-xs leading-5 text-slate-500 lg:block">
            Replace the temporary leaf mark with the official JESAM logo when
            it is added to the repo.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 lg:px-8 lg:py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#d9deec] bg-[linear-gradient(135deg,#1f2a52_0%,#31427a_42%,#d7c4a3_140%)] px-7 py-8 text-white shadow-[0_24px_80px_rgba(36,49,95,0.16)] lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_58%)]" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute right-10 top-10 h-32 w-32 rounded-full border border-white/15 bg-white/10" />

          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.75fr] lg:items-start">
            <div className="space-y-6">
              <Badge className="w-fit border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                Public Access / No Login Required
              </Badge>

              <div className="space-y-4">
                <h1 className="max-w-3xl font-['Newsreader',serif] text-4xl leading-tight text-white sm:text-5xl lg:text-[3.6rem]">
                  Search the JESAM collection before you open a journal or paper.
                </h1>
                <p className="max-w-2xl font-['Public_Sans',sans-serif] text-base leading-7 text-slate-100/88 sm:text-lg">
                  Start with a research topic, review matching papers with quick
                  details, then continue through journal and paper pages without
                  leaving the public site.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge className="bg-[#f0e2c7] px-3 py-1 font-['Public_Sans',sans-serif] text-[#24315f] hover:bg-[#f0e2c7]">
                  Search-first public discovery
                </Badge>
                <Badge className="border border-white/15 bg-white/10 px-3 py-1 font-['Public_Sans',sans-serif] text-white hover:bg-white/10">
                  Full journal list stays available below
                </Badge>
              </div>
            </div>

            <Card className="border-white/12 bg-white/10 text-white shadow-none backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-['Newsreader',serif] text-2xl text-white">
                  Public access
                </CardTitle>
                <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-100/82">
                  This search shows only published papers and journals that are
                  available on the public site.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 font-['Public_Sans',sans-serif] text-sm text-slate-100/82">
                <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                  This page stays separate from author and editor dashboards.
                </div>
                <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                  Your search stays active while you move through the public
                  journal pages.
                </div>
                <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                  Only published JESAM papers and journals appear here.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-5">
          <JournalSearchPanel
            draftQuery={draftQuery}
            appliedQuery={appliedQuery}
            hasAppliedQuery={hasAppliedQuery}
            draftFilters={draftFilters}
            appliedFilters={appliedFilters}
            hasAppliedFilters={hasAppliedFilters}
            availableJournals={allJournals}
            availableYears={availableYears}
            availableFocusAreas={PUBLIC_JOURNAL_FOCUS_AREAS}
            validationMessage={validationMessage}
            onDraftQueryChange={updateDraftQuery}
            onDraftFilterChange={updateDraftFilter}
            onSubmitSearch={submitSearch}
            onClearFilters={clearFilters}
            onClearSearch={clearSearch}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6a5a3d]">
                {resultsLabel}
              </p>
              <h2 className="font-['Newsreader',serif] text-3xl text-[#1d2548]">
                {resultsHeading}
              </h2>
            </div>
            <Badge
              variant="outline"
              className="border-[#d8d3c7] bg-[#fbf6ec] px-3 py-1 text-[#5f4d31]"
            >
              {hasAppliedQuery
                ? `${articleResults.length} papers / ${matchingJournals.length} journals`
                : hasAppliedFilters
                  ? `${journals.length} journals match`
                  : "Publicly available"}
            </Badge>
          </div>

          {journalListingLoading && !hasAppliedQuery ? (
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

          {!journalListingLoading && journalListingError && !hasAppliedQuery ? (
            <Card className="border-[#efd1d1] bg-[linear-gradient(180deg,#ffffff,#fff7f6)] shadow-sm">
              <CardContent className="flex flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
                <div className="flex max-w-2xl gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fff2f2] text-[#b13d3d]">
                    <AlertCircle className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-['Newsreader',serif] text-2xl text-[#7f2525]">
                      Public journals could not be loaded
                    </h3>
                    <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                      The listing is temporarily unavailable. You can retry the
                      request without leaving the public dashboard.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={retryJournalListing}
                  className="bg-[#24315f] text-white hover:bg-[#1e294f]"
                >
                  Retry Listing
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {hasAppliedQuery && articleResultsLoading ? (
            <Card className="border-[#d8deef] bg-white/85 shadow-[0_18px_50px_rgba(36,49,95,0.08)]">
              <CardContent className="flex flex-col gap-4 px-6 py-8">
                <div className="flex items-center gap-3 text-[#24315f]">
                  <Sparkles className="size-4 animate-pulse" />
                  <p className="font-['Public_Sans',sans-serif] text-sm">
                    Searching for papers matching "{appliedQuery}"...
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,#eef1fb,#f6efe1)]" />
                  <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,#eef1fb,#f6efe1)]" />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {hasAppliedQuery && articleResultsError ? (
            <Card className="border-[#efd1d1] bg-[linear-gradient(180deg,#ffffff,#fff7f6)] shadow-sm">
              <CardContent className="flex flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
                <div className="flex max-w-2xl gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fff2f2] text-[#b13d3d]">
                    <AlertCircle className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-['Newsreader',serif] text-2xl text-[#7f2525]">
                      Search results could not be loaded
                    </h3>
                    <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                      You can still browse the journals below, but this search
                      could not be completed right now.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={retryArticleResults}
                    className="bg-[#24315f] text-white hover:bg-[#1e294f]"
                  >
                    Retry Search
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearSearch}
                    className="border-[#cfd8ef] text-[#24315f]"
                  >
                    Return to Browse
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {hasAppliedQuery &&
          !articleResultsLoading &&
          !articleResultsError &&
          !hasSearchResults ? (
            <Card className="border-[#d8deef] bg-[linear-gradient(180deg,#ffffff,#fbf6ec)] shadow-sm">
              <CardContent className="space-y-4 px-6 py-8">
                <div className="flex items-center gap-3 text-[#24315f]">
                  <Search className="size-4" />
                  <p className="font-['Public_Sans',sans-serif] text-sm">
                    No published papers matched "{appliedQuery}".
                  </p>
                </div>
                <p className="max-w-2xl font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                  Try a broader topic, another paper keyword, a journal name,
                  or clear the search to return to the full journal list.
                </p>
                <div>
                  <Button
                    variant="outline"
                    onClick={clearSearch}
                    className="border-[#cfd8ef] text-[#24315f]"
                  >
                    Clear Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!journalListingLoading &&
          !journalListingError &&
          journals.length === 0 &&
          !hasAppliedQuery ? (
            <Card className="border-[#d8deef] bg-[linear-gradient(180deg,#ffffff,#fbf6ec)] shadow-sm">
              <CardContent className="space-y-3 px-6 py-8">
                <h3 className="font-['Newsreader',serif] text-2xl text-[#24315f]">
                  {hasAppliedFilters
                    ? "No journals match the applied filters"
                    : "No public journals are available yet"}
                </h3>
                <p className="max-w-2xl font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                  {hasAppliedFilters
                    ? "Try clearing one or more filters to return to the broader journal list."
                    : "This dashboard is ready for public discovery, but there are no published journal records to show at the moment."}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {hasAppliedQuery &&
          !articleResultsLoading &&
          !articleResultsError &&
          hasSearchResults ? (
            <div className="space-y-6">
              <div className="rounded-[1.5rem] border border-[#dccfb8] bg-[linear-gradient(135deg,#fffaf0,#f5ecda)] px-5 py-4 shadow-[0_12px_30px_rgba(175,145,94,0.08)]">
                <p className="font-['Public_Sans',sans-serif] text-sm text-[#5f4d31]">
                  Showing results for{" "}
                  <span className="font-semibold">"{appliedQuery}"</span>.
                </p>
                <p className="mt-1 font-['Public_Sans',sans-serif] text-xs leading-5 text-slate-600">
                  Paper matches appear first. Journal matches stay separate so
                  it is always clear whether you are opening one paper or a
                  larger journal collection.
                </p>
              </div>

              {articleResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6a5a3d]">
                      Paper Matches
                    </p>
                    <h3 className="font-['Newsreader',serif] text-2xl text-[#1d2548]">
                      Published papers with quick details for fast scanning
                    </h3>
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

              {matchingJournals.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6a5a3d]">
                      Related Journals
                    </p>
                    <h3 className="font-['Newsreader',serif] text-2xl text-[#1d2548]">
                      Journals connected to your search
                    </h3>
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
            </div>
          ) : null}

          {!journalListingLoading &&
          !journalListingError &&
          journals.length > 0 &&
          !hasAppliedQuery ? (
            <div className="space-y-4">
              <div className="grid gap-5">
                {journals.map((journal) => (
                  <JournalListCard
                    key={journal.id}
                    journal={journal}
                    returnTo={returnTo}
                    returnLabel={
                      hasAppliedFilters
                        ? "Back to Filtered Journals"
                        : "Back to Journals"
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {featurePanels.map(({ icon: Icon, title, description, tone }) => (
            <Card
              key={title}
              className={`overflow-hidden border ${tone} shadow-[0_18px_40px_rgba(36,49,95,0.08)]`}
            >
              <CardHeader className="gap-3 pb-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white/80 text-[#24315f] shadow-sm">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="font-['Newsreader',serif] text-2xl text-[#24315f]">
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6 pt-0">
                <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                  {description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
