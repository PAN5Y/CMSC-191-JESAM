import type { FormEvent } from "react";
import { Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JournalSearchPanelProps {
  draftQuery: string;
  hasAppliedQuery: boolean;
  validationMessage: string | null;
  onDraftQueryChange: (value: string) => void;
  onSubmitSearch: () => void;
  onClearSearch: () => void;
}

export default function JournalSearchPanel({
  draftQuery,
  hasAppliedQuery,
  validationMessage,
  onDraftQueryChange,
  onSubmitSearch,
  onClearSearch,
}: JournalSearchPanelProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmitSearch();
  };

  return (
    <Card className="overflow-hidden border-[#d8deef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfe_46%,#f5f7ff_100%)] shadow-[0_22px_55px_rgba(36,49,95,0.1)]">
      <CardHeader className="space-y-3 border-b border-[#e3e7f3] bg-[linear-gradient(135deg,#f8f9ff_0%,#fbf5e8_100%)] px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="font-['Newsreader',serif] text-2xl text-[#24315f]">
            Search published papers and journal collections
          </CardTitle>
          <Badge
            variant="outline"
            className="border-[#d2d9f2] bg-white px-3 py-1 text-[#24315f]"
          >
            Publicly available only
          </Badge>
        </div>
        <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
          Search by topic, author, journal title, publication detail, or year.
          Results update only when you submit.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 p-6 sm:p-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label
              htmlFor="public-journal-search"
              className="font-['Public_Sans',sans-serif] text-sm text-[#24315f]"
            >
              Search topic, author, or journal
            </Label>
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="public-journal-search"
                  value={draftQuery}
                  onChange={(event) => onDraftQueryChange(event.target.value)}
                  placeholder="Try coastal monitoring, air quality governance, estuary restoration, or 2024"
                  className="h-12 border-[#cfd8ef] bg-white pl-9 font-['Public_Sans',sans-serif] text-sm text-slate-700 shadow-sm"
                />
              </div>
              <div className="flex gap-3 lg:shrink-0">
                <Button
                  type="submit"
                  className="h-12 bg-[#24315f] px-5 text-white shadow-[0_14px_24px_rgba(36,49,95,0.18)] hover:bg-[#1e294f]"
                >
                  Search
                </Button>
                {hasAppliedQuery || draftQuery.trim() ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClearSearch}
                    className="h-12 border-[#d4c7ad] bg-[#fffaf0] text-[#5f4d31]"
                  >
                    Clear Search
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </form>

        {validationMessage ? (
          <Alert className="border-[#e8d3a1] bg-[#fffaf0] text-[#7a4b11]">
            <Search className="size-4" />
            <AlertTitle className="font-['Public_Sans',sans-serif] text-sm">
              Add a search term to begin
            </AlertTitle>
            <AlertDescription className="font-['Public_Sans',sans-serif]">
              <p>{validationMessage}</p>
              <p>
                The browse view remains available below while you refine the
                search.
              </p>
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
