import {
  AlertCircle,
  ArrowLeft,
  BookOpenText,
  Compass,
  Leaf,
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
import ArticlePreviewCard from "../components/ArticlePreviewCard";
import { usePublicJournalDetail } from "../hooks/usePublicJournalDetail";
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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf1fb_0%,#f5efe5_22%,#f7f8fc_56%,#fcfcfd_100%)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-[#d8deef] bg-[linear-gradient(135deg,#24315f,#51639a)] text-white shadow-[0_12px_28px_rgba(36,49,95,0.18)]">
              <Leaf className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-['Newsreader',serif] text-2xl tracking-tight text-[#24315f]">
                JESAM Journals
              </p>
              <p className="font-['Public_Sans',sans-serif] text-sm text-slate-600">
                Journal details and published paper browsing
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to={returnTarget.to}>
              <ArrowLeft />
              {returnTarget.label}
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8 lg:py-14">
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
          <Card className="border-[#efd1d1] bg-[linear-gradient(180deg,#ffffff,#fff7f6)] shadow-sm">
            <CardContent className="flex flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
              <div className="flex max-w-2xl gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fff2f2] text-[#b13d3d]">
                  <AlertCircle className="size-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-['Newsreader',serif] text-2xl text-[#7f2525]">
                    Journal detail could not be loaded
                  </h2>
                  <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                    The journal page is temporarily unavailable. You can retry
                    the request or return to the public journal listing.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={retry}
                  className="bg-[#24315f] text-white hover:bg-[#1e294f]"
                >
                  Retry Detail
                </Button>
                <Button asChild variant="outline">
                  <Link to={returnTarget.to}>{returnTarget.label}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
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
              <Button asChild className="bg-[#24315f] text-white hover:bg-[#1e294f]">
                <Link to={returnTarget.to}>{returnTarget.label}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!loading && !error && journalDetail ? (
          <>
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

              {journalDetail.articlePreviews.length > 0 ? (
                <div className="grid gap-5">
                  {journalDetail.articlePreviews.map((article) => (
                    <ArticlePreviewCard
                      key={article.id}
                      article={article}
                      journalId={journalDetail.id}
                      journalTitle={journalDetail.title}
                      returnTo={returnTarget.to}
                      returnLabel={returnTarget.label}
                    />
                  ))}
                </div>
              ) : (
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
              )}
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <Card className="border-[#dce3f3] bg-[linear-gradient(180deg,#ffffff,#eef3ff)] shadow-[0_18px_40px_rgba(36,49,95,0.08)]">
                <CardHeader className="gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#24315f] shadow-sm">
                    <Compass className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="font-['Newsreader',serif] text-xl text-[#24315f] sm:text-2xl">
                      Keep Orientation
                    </CardTitle>
                    <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                      Return to the journals listing at any point without
                      entering the internal editorial flow.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-[#ddd3c1] bg-[linear-gradient(180deg,#fffdf9,#f4ecdd)] shadow-[0_18px_40px_rgba(175,145,94,0.08)]">
                <CardHeader className="gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#24315f] shadow-sm">
                    <BookOpenText className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="font-['Newsreader',serif] text-xl text-[#24315f] sm:text-2xl">
                      Paper Details Are Available
                    </CardTitle>
                    <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                      Open a published paper to review the abstract and details.
                      Download decisions remain in later work.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
