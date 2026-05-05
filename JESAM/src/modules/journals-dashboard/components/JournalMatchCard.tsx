import { ArrowRight, BookOpenText, Layers3 } from "lucide-react";
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

export default function JournalMatchCard({
  journal,
  returnTo,
}: {
  journal: PublicJournalListItem;
  returnTo: string;
}) {
  return (
    <Card className="overflow-hidden border-[#d9dfef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_62%,#f4ecdd_150%)] shadow-[0_20px_48px_rgba(36,49,95,0.09)]">
      <div className="h-1 w-full bg-[linear-gradient(90deg,#d7c4a3_0%,#7b89b8_48%,#24315f_100%)]" />
      <CardHeader className="gap-3 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-[#cfd8ef] bg-white text-[#24315f]"
          >
            Related Journal
          </Badge>
          <Badge className="bg-[#eef1fb] text-[#24315f] hover:bg-[#eef1fb]">
            {journal.totalPublishedArticles} published papers
          </Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="font-['Newsreader',serif] text-2xl leading-tight text-[#1d2548]">
            {journal.title}
          </CardTitle>
          <CardDescription className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
            {journal.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pb-5 md:grid-cols-2">
        <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <BookOpenText className="mt-0.5 size-4 text-[#24315f]" />
            <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Topics
                </p>
                <p className="mt-1 font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-700">
                  {journal.focusAreas.length > 0
                    ? journal.focusAreas.join(", ")
                    : "Topics coming soon"}
                </p>
              </div>
            </div>
        </div>
        <div className="rounded-2xl border border-[#e0e5f2] bg-white/80 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <Layers3 className="mt-0.5 size-4 text-[#24315f]" />
            <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Latest publication
                </p>
                <p className="mt-1 font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-700">
                  {journal.latestIssueLabel ?? "Publication details coming soon"}
                </p>
              </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-white/70 bg-white/35 pb-6 pt-5">
        <Button
          asChild
          variant="outline"
          className="border-[#cfd8ef] bg-white/80 text-[#24315f]"
        >
          <Link
            to={`/journals/${journal.id}`}
            state={{
              returnTo,
              returnLabel: "Back to Search Results",
            }}
          >
            Open Journal
            <ArrowRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
