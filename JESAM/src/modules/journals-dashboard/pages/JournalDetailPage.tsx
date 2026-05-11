import {
  ArrowLeft,
  BookOpenText,
  Search,
  Sparkles,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ArticlePreviewCard from "../components/ArticlePreviewCard";
import PublicJournalsShell from "../components/PublicJournalsShell";
import { PublicRecoveryState } from "../components/PublicRecoveryState";
import { useJournalArticlePreviewSearch } from "../hooks/useJournalArticlePreviewSearch";
import { usePublicJournalDetail } from "../hooks/usePublicJournalDetail";
import { getPublicRecoveryCopy } from "../queries/publicRecoveryState";
import type { PublicJournalDetailRouteState } from "../types";

function formatPublishedDate(date: string | null) {
  if (!date) {
    return "Publication date pending";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Publication date pending";
  }

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCoverageYears(years: number[]) {
  if (years.length === 0) {
    return "Coverage years pending";
  }

  if (years.length === 1) {
    return `${years[0]}`;
  }

  return `${Math.min(...years)} - ${Math.max(...years)}`;
}

export default function JournalDetailPage() {
  const { journalId } = useParams<{ journalId: string }>();
  const location = useLocation();
  const routeState = location.state as PublicJournalDetailRouteState | null;
  const { journalDetail, loading, error, notFound, retry } =
    usePublicJournalDetail(journalId);
  const returnTarget = {
    to: routeState?.returnTo ?? "/journals",
    label: routeState?.returnLabel ?? "Back to Journals",
  };
  const recoveryCopy = getPublicRecoveryCopy("journal-detail");
  const previewSearch = useJournalArticlePreviewSearch(
    journalDetail?.articlePreviews ?? [],
    {
      resetKey: journalId,
      initialQuery: routeState?.localSearchQuery ?? "",
    }
  );
  const journalReturnTo = journalId ? `/journals/${journalId}` : "/journals";

  return (
    <PublicJournalsShell
      backgroundClassName="bg-[linear-gradient(180deg,#edf1fb_0%,#f5efe5_22%,#f7f8fc_56%,#fcfcfd_100%)]"
    >
        {loading ? (
          <Card className="border-[#d8deef] bg-white/85 shadow-[0_18px_50px_rgba(36,49,95,0.08)]">
            <CardContent className="flex flex-col gap-4 px-6 py-8">
              <div className="flex items-center gap-3 text-[#24315f]">
                <Sparkles className="size-4 animate-pulse" />
                <p className="font-['Public_Sans',sans-serif] text-sm">
                  Loading journal details and published papers...
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

        {!loading && error ? (
          <PublicRecoveryState
            title={recoveryCopy.title}
            description={recoveryCopy.description}
            primaryActionLabel={recoveryCopy.primaryActionLabel}
            onPrimaryAction={retry}
            secondaryActionLabel={returnTarget.label}
            secondaryActionTo={returnTarget.to}
          />
        ) : null}

        {!loading && !error && notFound ? (
          <Card className="border-[#d8deef] bg-[linear-gradient(180deg,#ffffff,#fbf6ec)] shadow-sm">
            <CardContent className="space-y-4 px-6 py-8">
              <h2 className="font-['Newsreader',serif] text-2xl text-[#24315f]">
                Journal not found
              </h2>
              <p className="max-w-2xl font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                The requested journal is not available in the current public
                listing. You can continue browsing from the journals list.
              </p>
              <Button
                asChild
                className="bg-[#24315f] text-white hover:bg-[#1e294f]"
              >
                <Link to={returnTarget.to}>{returnTarget.label}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!loading && !error && journalDetail ? (
          <>
            <div className="flex items-start">
              <Button
                asChild
                variant="outline"
                className="border-[#d8deef] bg-white/90 text-[#24315f] hover:bg-[#f5f8ff]"
              >
                <Link to={returnTarget.to}>
                  <ArrowLeft />
                  {returnTarget.label}
                </Link>
              </Button>
            </div>

            <section className="relative overflow-hidden rounded-[2rem] border border-[#d9deec] bg-[linear-gradient(135deg,#1f2a52_0%,#304178_42%,#d7c4a3_140%)] px-7 py-8 text-white shadow-[0_24px_80px_rgba(36,49,95,0.16)] lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:gap-8 lg:px-10 lg:py-10">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_58%)]" />
              <div className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

              <div className="relative space-y-5">
                <Badge className="w-fit border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                  Journal Details
                </Badge>
                <div className="space-y-4">
                  <h1 className="font-['Newsreader',serif] text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                    {journalDetail.title}
                  </h1>
                  <p className="max-w-3xl font-['Public_Sans',sans-serif] text-sm leading-7 text-slate-100/88 sm:text-base lg:text-lg">
                    {journalDetail.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {journalDetail.focusAreas.length > 0 ? (
                    journalDetail.focusAreas.map((focusArea) => (
                      <Badge
                        key={focusArea}
                        className="border border-white/15 bg-white/10 text-white hover:bg-white/10"
                      >
                        {focusArea}
                      </Badge>
                    ))
                  ) : (
                    <Badge className="border border-white/15 bg-white/10 text-slate-100/82 hover:bg-white/10">
                      Topics coming soon
                    </Badge>
                  )}
                </div>
              </div>

              <Card className="relative border-white/12 bg-white/10 shadow-none backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="font-['Newsreader',serif] text-xl text-white sm:text-2xl">
                    About this journal
                  </CardTitle>
                  <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-100/82">
                    Start with the journal, then scan paper previews before you
                    open a full paper page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 font-['Public_Sans',sans-serif] text-sm text-slate-100/82">
                  <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                    Publisher: {journalDetail.institution}
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                    ISSN: {journalDetail.issn ?? "Not listed"}
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                    Access: {journalDetail.accessLabel}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-[#dce3f3] bg-[linear-gradient(180deg,#ffffff,#eef3ff)] shadow-[0_16px_38px_rgba(36,49,95,0.08)]">
                <CardHeader className="gap-2">
                  <CardDescription className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Published Papers
                  </CardDescription>
                  <CardTitle className="font-['Newsreader',serif] text-2xl text-[#24315f] sm:text-3xl">
                    {journalDetail.totalPublishedArticles}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-[#dce3f3] bg-[linear-gradient(180deg,#ffffff,#f6f8ff)] shadow-[0_16px_38px_rgba(36,49,95,0.08)]">
                <CardHeader className="gap-2">
                  <CardDescription className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Coverage
                  </CardDescription>
                  <CardTitle className="font-['Newsreader',serif] text-2xl text-[#24315f] sm:text-3xl">
                    {formatCoverageYears(journalDetail.coverageYears)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-[#ddd3c1] bg-[linear-gradient(180deg,#fffdf9,#f4ecdd)] shadow-[0_16px_38px_rgba(175,145,94,0.08)]">
                <CardHeader className="gap-2">
                  <CardDescription className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Latest Publication
                  </CardDescription>
                  <CardTitle className="font-['Newsreader',serif] text-lg leading-snug text-[#24315f] sm:text-xl">
                    {formatPublishedDate(journalDetail.latestPublicationDate)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-[#d9dce9] bg-[linear-gradient(180deg,#ffffff,#f5f4fb)] shadow-[0_16px_38px_rgba(36,49,95,0.08)]">
                <CardHeader className="gap-2">
                  <CardDescription className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Latest publication details
                  </CardDescription>
                  <CardTitle className="font-['Newsreader',serif] text-lg leading-snug text-[#24315f] sm:text-xl">
                    {journalDetail.latestIssueLabel ?? "Publication details coming soon"}
                  </CardTitle>
                </CardHeader>
              </Card>
            </section>

            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#6a5a3d]">
                    <BookOpenText className="size-4" />
                    <p className="text-sm font-medium uppercase tracking-[0.18em]">
                      Published Paper Previews
                    </p>
                  </div>
                  <h2 className="font-['Newsreader',serif] text-2xl text-[#1d2548] sm:text-3xl">
                    Browse papers in this journal before opening one
                  </h2>
                </div>
                <Badge className="border border-[#dccfb8] bg-[#fffaf0] px-3 py-1 text-[#5f4d31] hover:bg-[#fffaf0]">
                  Journal view first
                </Badge>
              </div>

              <Card className="overflow-hidden border-[#d8deef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfe_46%,#f5f7ff_100%)] shadow-[0_22px_55px_rgba(36,49,95,0.1)]">
                <CardHeader className="space-y-3 border-b border-[#e3e7f3] bg-[linear-gradient(135deg,#f8f9ff_0%,#fbf5e8_100%)]">
                  <CardTitle className="font-['Newsreader',serif] text-2xl text-[#24315f]">
                    Search within this journal
                  </CardTitle>
                  <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                    Narrow this journal's published previews by title, author,
                    abstract text, topic, year, or issue label.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      previewSearch.submitSearch();
                    }}
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="journal-article-preview-search"
                        className="font-['Public_Sans',sans-serif] text-sm text-[#24315f]"
                      >
                        Search within this journal
                      </Label>
                      <div className="flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="journal-article-preview-search"
                            value={previewSearch.draftQuery}
                            onChange={(event) =>
                              previewSearch.updateDraftQuery(event.target.value)
                            }
                            placeholder="Try author names, topic words, year, or issue label"
                            className="h-12 border-[#cfd8ef] bg-white pl-9 font-['Public_Sans',sans-serif] text-sm text-slate-700 shadow-sm"
                          />
                        </div>
                        <div className="flex gap-3 md:shrink-0">
                          <Button
                            type="submit"
                            className="h-12 bg-[#24315f] px-5 text-white hover:bg-[#1e294f]"
                          >
                            Apply Search
                          </Button>
                          {previewSearch.hasAppliedQuery ||
                          previewSearch.draftQuery.trim() ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={previewSearch.clearSearch}
                              className="h-12 border-[#d4c7ad] bg-[#fffaf0] text-[#5f4d31]"
                            >
                              Clear Search
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </form>

                  {previewSearch.validationMessage ? (
                    <div className="rounded-2xl border border-[#e8d3a1] bg-[#fffaf0] px-4 py-3">
                      <p className="font-['Public_Sans',sans-serif] text-sm text-[#7a4b11]">
                        {previewSearch.validationMessage}
                      </p>
                    </div>
                  ) : null}

                  {previewSearch.hasAppliedQuery ? (
                    <div className="rounded-2xl border border-[#dccfb8] bg-[linear-gradient(135deg,#fffaf0,#f5ecda)] px-4 py-3">
                      <p className="font-['Public_Sans',sans-serif] text-sm text-[#24315f]">
                        Current search:{" "}
                        <span className="font-semibold">
                          "{previewSearch.appliedQuery}"
                        </span>
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {previewSearch.matchingPreviews.length > 0 ? (
                <div className="grid gap-5">
                  {previewSearch.matchingPreviews.map((article) => (
                    <ArticlePreviewCard
                      key={article.id}
                      article={article}
                      journalId={journalDetail.id}
                      journalTitle={journalDetail.title}
                      returnTo={journalReturnTo}
                      returnLabel="Back to Journal Detail"
                      journalReturnTo={returnTarget.to}
                      journalReturnLabel={returnTarget.label}
                      journalSearchQuery={previewSearch.appliedQuery}
                    />
                  ))}
                </div>
              ) : previewSearch.hasAppliedQuery ? (
                <Card className="border-[#dce3f3] bg-[linear-gradient(180deg,#ffffff,#fbf6ec)] shadow-sm">
                  <CardContent className="space-y-3 px-6 py-8">
                    <h3 className="font-['Newsreader',serif] text-xl text-[#24315f] sm:text-2xl">
                      No paper previews match this journal search
                    </h3>
                    <p className="max-w-2xl font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                      Try a broader topic, author name, year, or issue label, or
                      clear the journal-local search to return to the full preview
                      list.
                    </p>
                    <Button
                      variant="outline"
                      onClick={previewSearch.clearSearch}
                      className="border-[#cfd8ef] text-[#24315f]"
                    >
                      Clear Search
                    </Button>
                  </CardContent>
                </Card>
              ) : journalDetail.articlePreviews.length === 0 ? (
                <Card className="border-[#dce3f3] bg-[linear-gradient(180deg,#ffffff,#fbf6ec)] shadow-sm">
                  <CardContent className="space-y-3 px-6 py-8">
                    <h3 className="font-['Newsreader',serif] text-xl text-[#24315f] sm:text-2xl">
                      No published paper previews are available yet
                    </h3>
                    <p className="max-w-2xl font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                      This journal is listed here, but there are no published
                      paper previews to show right now.
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </section>

          </>
        ) : null}
    </PublicJournalsShell>
  );
}
