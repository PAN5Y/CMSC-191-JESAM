import { ArrowRight, CalendarDays, Layers3, Tag, Users } from "lucide-react";
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
import type { PublicJournalArticlePreview } from "../types";

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

export default function ArticlePreviewCard({
  article,
  journalId,
  journalTitle,
  returnTo,
  returnLabel,
}: {
  article: PublicJournalArticlePreview;
  journalId: string;
  journalTitle: string;
  returnTo?: string;
  returnLabel?: string;
}) {
  return (
    <Card className="overflow-hidden border-[#d9dfef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_58%,#eef3ff_140%)] shadow-[0_20px_48px_rgba(36,49,95,0.09)]">
      <div className="h-1 w-full bg-[linear-gradient(90deg,#7b89b8_0%,#24315f_52%,#d7c4a3_100%)]" />
      <CardHeader className="gap-3 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-[#cfd8ef] bg-white text-[#24315f]"
          >
            Published Paper Preview
          </Badge>
          {article.classification ? (
            <Badge className="bg-[#eef1fb] text-[#24315f] hover:bg-[#eef1fb]">
              {article.classification}
            </Badge>
          ) : null}
        </div>
        <div className="space-y-2">
          <CardTitle className="font-['Newsreader',serif] text-2xl leading-tight text-[#1d2548]">
            {article.title}
          </CardTitle>
          <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
            {article.abstractExcerpt ??
              "Abstract preview is not available yet for this published paper."}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 pb-5 md:grid-cols-3">
        <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 size-4 text-[#24315f]" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Authors
              </p>
              <p className="mt-1 font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-700">
                {article.authors.length > 0
                  ? article.authors.join(", ")
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
                {formatPublishedDate(article.publishedAt)}
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
                {article.issueLabel ?? "Publication details coming soon"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-slate-100 pb-6 pt-5">
        <div className="flex w-full flex-col gap-4 rounded-[1.4rem] border border-[#ddd3c1] bg-[linear-gradient(135deg,#fffaf0,#f5ecda)] px-4 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Tag className="mt-0.5 size-4 text-[#24315f]" />
            <p className="font-['Public_Sans',sans-serif] leading-6">
              Open this paper to review the abstract and quick details before
              download options are added later.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-[#cfd8ef] bg-white/80 text-[#24315f]"
          >
          <Link
            to={`/journals/articles/${article.id}`}
            state={{ returnTo, returnLabel, journalId, journalTitle }}
          >
            Open Paper
            <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
