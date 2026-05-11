import {
  ArrowLeft,
  Bot,
  FileText,
  Sparkles,
  Tag,
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
import { DownloadAvailabilityState } from "../components/DownloadAvailabilityState";
import { ArticleAssistantPanel } from "../components/ArticleAssistantPanel";
import PublicJournalsShell from "../components/PublicJournalsShell";
import { PublicRecoveryState } from "../components/PublicRecoveryState";
import { SummaryPanel } from "../components/SummaryPanel";
import { usePublicArticleDetail } from "../hooks/usePublicArticleDetail";
import { getPublicRecoveryCopy } from "../queries/publicRecoveryState";
import type { PublicArticleDetailRouteState } from "../types";

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

function getReturnTarget(
  state: PublicArticleDetailRouteState | null | undefined,
  fallbackJournalId?: string
) {
  if (state?.returnTo) {
    const journalDetailState =
      state.journalDetailReturnTo ||
      state.journalDetailReturnLabel ||
      state.journalLocalSearchQuery
        ? {
            returnTo: state.journalDetailReturnTo,
            returnLabel: state.journalDetailReturnLabel,
            localSearchQuery: state.journalLocalSearchQuery,
          }
        : undefined;

    return {
      to: state.returnTo,
      label: state.returnLabel ?? "Back to Search Results",
      state: journalDetailState,
    };
  }

  const journalId = state?.journalId ?? fallbackJournalId;

  if (journalId) {
    return {
      to: `/journals/${journalId}`,
      label: "Back to Journal Detail",
    };
  }

  return {
    to: "/journals",
    label: "Back to Journals",
  };
}

export default function ArticleDetailPage() {
  const { articleId } = useParams<{ articleId: string }>();
  const location = useLocation();
  const routeState = location.state as PublicArticleDetailRouteState | null;
  const { articleDetail, loading, error, notFound, retry } =
    usePublicArticleDetail(articleId);
  const returnTarget = getReturnTarget(routeState, articleDetail?.journalId);
  const recoveryCopy = getPublicRecoveryCopy("article-detail");

  return (
    <PublicJournalsShell
      backgroundClassName="bg-[linear-gradient(180deg,#eef1fb_0%,#f5efe5_24%,#f7f8fc_56%,#fcfcfd_100%)]"
    >
        {loading ? (
          <Card className="border-[#d8deef] bg-white/85 shadow-[0_18px_50px_rgba(36,49,95,0.08)]">
            <CardContent className="flex flex-col gap-4 px-6 py-8">
              <div className="flex items-center gap-3 text-[#24315f]">
                <Sparkles className="size-4 animate-pulse" />
                <p className="font-['Public_Sans',sans-serif] text-sm">
                  Loading paper details...
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
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
                Paper not found
              </h2>
              <p className="max-w-2xl font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                The requested paper is not available in the current public
                listing. You can continue browsing from the journal page or the
                public journals list.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-[#24315f] text-white hover:bg-[#1e294f]"
                >
                  <Link to={returnTarget.to} state={returnTarget.state}>
                    {returnTarget.label}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/journals">Browse Journals</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!loading && !error && articleDetail ? (
          <>
            <div className="flex items-start">
              <Button
                asChild
                variant="outline"
                className="border-[#d8deef] bg-white/90 text-[#24315f] hover:bg-[#f5f8ff]"
              >
                <Link to={returnTarget.to} state={returnTarget.state}>
                  <ArrowLeft />
                  {returnTarget.label}
                </Link>
              </Button>
            </div>

            <section className="relative overflow-hidden rounded-[2rem] border border-[#d9deec] bg-[linear-gradient(135deg,#1f2a52_0%,#304178_42%,#d7c4a3_140%)] px-7 py-8 text-white shadow-[0_24px_80px_rgba(36,49,95,0.16)] lg:grid lg:grid-cols-[1.3fr_0.7fr] lg:gap-8 lg:px-10 lg:py-10">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_58%)]" />
              <div className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

              <div className="relative space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                    Paper Details
                  </Badge>
                  <Badge className="border border-white/15 bg-white/10 text-slate-100/82 hover:bg-white/10">
                    {articleDetail.journalTitle}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <h1 className="font-['Newsreader',serif] text-4xl leading-tight text-white sm:text-5xl">
                    {articleDetail.title}
                  </h1>
                  <p className="font-['Public_Sans',sans-serif] text-base leading-7 text-slate-100/86 sm:text-lg">
                    {articleDetail.authors.length > 0
                      ? articleDetail.authors.join(", ")
                      : "Author listing pending"}
                  </p>
                </div>
              </div>

              <Card className="relative border-white/12 bg-white/10 shadow-none backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="font-['Newsreader',serif] text-2xl text-white">
                    About this paper
                  </CardTitle>
                  <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-100/82">
                    This page focuses on one paper and stays inside the public
                    browsing flow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 font-['Public_Sans',sans-serif] text-sm text-slate-100/82">
                  <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                    Journal: {articleDetail.journalTitle}
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                    Published: {formatPublishedDate(articleDetail.publishedAt)}
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                    Publication details: {articleDetail.issueLabel ?? "Coming soon"}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-[#dce3f3] bg-[linear-gradient(180deg,#ffffff,#eef3ff)] shadow-[0_16px_38px_rgba(36,49,95,0.08)]">
                <CardHeader className="gap-2">
                  <CardDescription className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Journal Source
                  </CardDescription>
                  <CardTitle className="font-['Newsreader',serif] text-xl text-[#24315f]">
                    {articleDetail.journalTitle}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-[#dce3f3] bg-[linear-gradient(180deg,#ffffff,#f6f8ff)] shadow-[0_16px_38px_rgba(36,49,95,0.08)]">
                <CardHeader className="gap-2">
                  <CardDescription className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Published
                  </CardDescription>
                  <CardTitle className="font-['Newsreader',serif] text-xl text-[#24315f]">
                    {formatPublishedDate(articleDetail.publishedAt)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-[#ddd3c1] bg-[linear-gradient(180deg,#fffdf9,#f4ecdd)] shadow-[0_16px_38px_rgba(175,145,94,0.08)]">
                <CardHeader className="gap-2">
                  <CardDescription className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Topic
                  </CardDescription>
                  <CardTitle className="font-['Newsreader',serif] text-xl text-[#24315f]">
                    {articleDetail.classification ?? "Topic not listed"}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-[#d9dce9] bg-[linear-gradient(180deg,#ffffff,#f5f4fb)] shadow-[0_16px_38px_rgba(36,49,95,0.08)]">
                <CardHeader className="gap-2">
                  <CardDescription className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    DOI
                  </CardDescription>
                  <CardTitle className="font-['Newsreader',serif] text-lg text-[#24315f]">
                    {articleDetail.doi ?? "DOI not listed"}
                  </CardTitle>
                </CardHeader>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6">
                <Card className="border-[#dce3f3] bg-[linear-gradient(180deg,#ffffff,#f7f9ff)] shadow-[0_18px_44px_rgba(36,49,95,0.08)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-['Newsreader',serif] text-3xl text-[#1d2548]">
                      Abstract
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-['Public_Sans',sans-serif] text-sm leading-7 text-slate-700 sm:text-base">
                      {articleDetail.abstract ??
                        "An abstract is not available for this public article record yet."}
                    </p>
                  </CardContent>
                </Card>

                {articleDetail.summary ? (
                  <SummaryPanel summary={articleDetail.summary} />
                ) : null}
              </div>

              <div className="space-y-6">
                <Card className="border-[#dce3f3] bg-[linear-gradient(180deg,#ffffff,#eef3ff)] shadow-[0_18px_44px_rgba(36,49,95,0.08)]">
                  <CardHeader className="gap-3">
                    <div className="flex items-center gap-2 text-[#6a5a3d]">
                      <Tag className="size-4" />
                      <p className="text-sm font-medium uppercase tracking-[0.18em]">
                        Keywords
                      </p>
                    </div>
                    <CardTitle className="font-['Newsreader',serif] text-2xl text-[#24315f]">
                      Helpful keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {articleDetail.keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {articleDetail.keywords.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="outline"
                            className="border-[#cfd8ef] bg-white/90 text-[#24315f]"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
                        Keywords are not available for this paper yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <DownloadAvailabilityState
                  status={articleDetail.downloadAvailabilityStatus}
                  isDownloadable={articleDetail.isDownloadable}
                  downloadUrl={articleDetail.downloadUrl}
                />

                <ArticleAssistantPanel article={articleDetail} />
              </div>
            </section>

          </>
        ) : null}
    </PublicJournalsShell>
  );
}
