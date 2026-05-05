import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Layers3,
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
import type { PublicJournalListItem } from "../types";

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

export default function JournalListCard({
  journal,
  returnTo,
  returnLabel,
}: {
  journal: PublicJournalListItem;
  returnTo?: string;
  returnLabel?: string;
}) {
  return (
    <Card className="overflow-hidden border-[#d8deef] bg-[linear-gradient(180deg,#ffffff_0%,#fafbff_58%,#f6efe1_150%)] shadow-[0_22px_55px_rgba(36,49,95,0.1)]">
      <div className="h-1 w-full bg-[linear-gradient(90deg,#24315f_0%,#7b89b8_55%,#d7c4a3_100%)]" />
      <CardHeader className="gap-4 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-[#24315f] text-white hover:bg-[#24315f]">
            Journal Collection
          </Badge>
          <Badge
            variant="outline"
            className="border-[#d2d9f2] bg-[#f8faff] text-[#24315f]"
          >
            {journal.accessLabel}
          </Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="font-['Newsreader',serif] text-3xl leading-tight text-[#1d2548]">
            {journal.title}
          </CardTitle>
          <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
            {journal.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pb-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Publisher
            </p>
            <p className="mt-1 font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-700">
              {journal.institution}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              ISSN
            </p>
            <p className="mt-1 font-['Public_Sans',sans-serif] text-sm text-slate-700">
              {journal.issn ?? "Not listed"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Published papers
            </p>
            <p className="mt-1 font-['Newsreader',serif] text-3xl text-[#24315f]">
              {journal.totalPublishedArticles}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Coverage
            </p>
            <p className="mt-1 font-['Public_Sans',sans-serif] text-sm text-slate-700">
              {formatCoverageYears(journal.coverageYears)}
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.6rem] border border-[#dfe5f5] bg-[linear-gradient(135deg,#eef3ff,#ffffff)] p-5">
            <div className="mb-4 flex items-center gap-2 text-[#24315f]">
              <BookOpenText className="size-4" />
              <p className="text-sm font-medium uppercase tracking-[0.14em]">
                Topics
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {journal.focusAreas.length > 0 ? (
                journal.focusAreas.map((focusArea) => (
                  <Badge
                    key={focusArea}
                    variant="outline"
                    className="border-[#cfd8ef] bg-white text-[#24315f]"
                  >
                    {focusArea}
                  </Badge>
                ))
              ) : (
                <p className="font-['Public_Sans',sans-serif] text-sm text-slate-600">
                  Topics will appear as published papers are grouped.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-[1.6rem] border border-[#ddd3c1] bg-[linear-gradient(180deg,#fffdf9,#f4ecdd)] p-5">
            <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/65 px-4 py-3">
              <CalendarDays className="mt-0.5 size-4 text-[#24315f]" />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Latest Publication
                </p>
                <p className="mt-1 font-['Public_Sans',sans-serif] text-sm text-slate-700">
                  {formatPublishedDate(journal.latestPublicationDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/65 px-4 py-3">
              <Layers3 className="mt-0.5 size-4 text-[#24315f]" />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Latest publication details
                </p>
                <p className="mt-1 font-['Public_Sans',sans-serif] text-sm text-slate-700">
                  {journal.latestIssueLabel ?? "Publication details coming soon"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-start justify-between gap-4 border-t border-white/70 bg-white/35 pb-6 pt-5">
        <p className="font-['Public_Sans',sans-serif] text-sm text-slate-600">
          Open this journal to browse its published paper previews before you
          open a full paper page.
        </p>
        <Button
          asChild
          variant="outline"
          className="border-[#cfd8ef] text-[#24315f]"
        >
          <Link
            to={`/journals/${journal.id}`}
            state={
              returnTo
                ? {
                    returnTo,
                    returnLabel: returnLabel ?? "Back to Journals",
                  }
                : undefined
            }
          >
            Open Journal
            <ArrowRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
