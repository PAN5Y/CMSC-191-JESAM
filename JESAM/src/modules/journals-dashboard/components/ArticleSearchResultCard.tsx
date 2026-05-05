import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  FileText,
  Layers3,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublicArticleSearchResult } from "../types";

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

export default function ArticleSearchResultCard({
  result,
  returnTo,
}: {
  result: PublicArticleSearchResult;
  returnTo: string;
}) {
  return (
    <Card className="overflow-hidden border-[#d8deef] bg-[linear-gradient(180deg,#ffffff_0%,#fafbff_60%,#f5ecda_155%)] shadow-[0_22px_55px_rgba(36,49,95,0.1)]">
      <div className="h-1 w-full bg-[linear-gradient(90deg,#24315f_0%,#51639a_55%,#d7c4a3_100%)]" />
      <CardHeader className="gap-3 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-[#24315f] text-white hover:bg-[#24315f]">
            Published Paper
          </Badge>
          {result.classification ? (
            <Badge
              variant="outline"
              className="border-[#cfd8ef] bg-[#f8faff] text-[#24315f]"
            >
              {result.classification}
            </Badge>
          ) : null}
        </div>
        <div className="space-y-2">
          <CardTitle className="font-['Newsreader',serif] text-3xl leading-tight text-[#1d2548]">
            {result.title}
          </CardTitle>
          <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
            {result.abstractExcerpt ??
              "Abstract preview is not available yet for this published paper result."}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pb-5">
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <BookOpenText className="mt-0.5 size-4 text-[#24315f]" />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Journal
                </p>
                <p className="mt-1 font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-700">
                  {result.journalTitle}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 size-4 text-[#24315f]" />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Authors
                </p>
                <p className="mt-1 font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-700">
                  {result.authors.length > 0
                    ? result.authors.join(", ")
                    : "Author listing pending"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 text-[#24315f]" />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Published
                </p>
                <p className="mt-1 font-['Public_Sans',sans-serif] text-sm text-slate-700">
                  {formatPublishedDate(result.publishedAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <Layers3 className="mt-0.5 size-4 text-[#24315f]" />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Publication details
                </p>
                <p className="mt-1 font-['Public_Sans',sans-serif] text-sm text-slate-700">
                  {result.issueLabel ?? "Publication details coming soon"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#ddd3c1] bg-[linear-gradient(135deg,#fffaf0,#f5ecda)] px-5 py-4">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 size-4 text-[#24315f]" />
            <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
              Open this paper to read more, or open the journal first if you
              want to browse the larger collection.
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-start justify-between gap-3 border-t border-white/70 bg-white/35 pb-6 pt-5">
        <Button
          asChild
          variant="outline"
          className="border-[#cfd8ef] bg-white/75 text-[#24315f]"
        >
          <Link
            to={`/journals/${result.journalId}`}
            state={{
              returnTo,
              returnLabel: "Back to Search Results",
            }}
          >
            View Journal
          </Link>
        </Button>
        <Button
          asChild
          className="bg-[#24315f] text-white shadow-[0_14px_24px_rgba(36,49,95,0.18)] hover:bg-[#1e294f]"
        >
          <Link
            to={`/journals/articles/${result.articleId}`}
            state={{
              returnTo,
              returnLabel: "Back to Search Results",
              journalId: result.journalId,
              journalTitle: result.journalTitle,
            }}
          >
            Open Paper
            <ArrowRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
