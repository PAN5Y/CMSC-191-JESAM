import type { FormEvent } from "react";
import { Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  PublicJournalFilters,
  PublicJournalFocusArea,
  PublicJournalListItem,
} from "../types";

interface JournalSearchPanelProps {
  draftQuery: string;
  appliedQuery: string;
  hasAppliedQuery: boolean;
  draftFilters: PublicJournalFilters;
  appliedFilters: PublicJournalFilters;
  hasAppliedFilters: boolean;
  availableJournals: PublicJournalListItem[];
  availableYears: string[];
  availableFocusAreas: PublicJournalFocusArea[];
  validationMessage: string | null;
  onDraftQueryChange: (value: string) => void;
  onDraftFilterChange: <K extends keyof PublicJournalFilters>(
    key: K,
    value: PublicJournalFilters[K]
  ) => void;
  onSubmitSearch: () => void;
  onClearFilters: () => void;
  onClearSearch: () => void;
}

export default function JournalSearchPanel({
  draftQuery,
  appliedQuery,
  hasAppliedQuery,
  draftFilters,
  appliedFilters,
  hasAppliedFilters,
  availableJournals,
  availableYears,
  availableFocusAreas,
  validationMessage,
  onDraftQueryChange,
  onDraftFilterChange,
  onSubmitSearch,
  onClearFilters,
  onClearSearch,
}: JournalSearchPanelProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmitSearch();
  };
  const hasPendingFilterChanges =
    draftFilters.classification !== appliedFilters.classification ||
    draftFilters.journalId !== appliedFilters.journalId ||
    draftFilters.coverageYear !== appliedFilters.coverageYear;

  return (
    <Card className="overflow-hidden border-[#d8deef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfe_46%,#f5f7ff_100%)] shadow-[0_22px_55px_rgba(36,49,95,0.1)]">
      <CardHeader className="space-y-3 border-b border-[#e3e7f3] bg-[linear-gradient(135deg,#f8f9ff_0%,#fbf5e8_100%)]">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-['Newsreader',serif] text-2xl text-[#24315f]">
            Search published papers
          </CardTitle>
          <Badge
            variant="outline"
            className="border-[#d2d9f2] bg-white px-3 py-1 text-[#24315f]"
          >
            Publicly available only
          </Badge>
        </div>
        <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
          Search by paper title, author, abstract words, journal name,
          publication details, or topic. This page only shows published JESAM
          content that is publicly available.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label
              htmlFor="public-journal-search"
              className="font-['Public_Sans',sans-serif] text-sm text-[#24315f]"
            >
              Search topic or keyword
            </Label>
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="public-journal-search"
                  value={draftQuery}
                  onChange={(event) => onDraftQueryChange(event.target.value)}
                  placeholder="Try land use, air quality, governance, 2024, or coastal monitoring"
                  className="h-12 border-[#cfd8ef] bg-white pl-9 font-['Public_Sans',sans-serif] text-sm text-slate-700 shadow-sm"
                />
              </div>
              <div className="flex gap-3 lg:shrink-0">
                <Button
                  type="submit"
                  className="h-12 bg-[#24315f] px-5 text-white shadow-[0_14px_24px_rgba(36,49,95,0.18)] hover:bg-[#1e294f]"
                >
                  Search Papers
                </Button>
                {hasAppliedQuery || draftQuery.trim() ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClearSearch}
                    className="h-12 border-[#d4c7ad] bg-[#fffaf0] text-[#5f4d31]"
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </form>
        <div className="space-y-3 rounded-[1.4rem] border border-[#e3e7f3] bg-[linear-gradient(135deg,#fbfcff,#f6f8ff)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-['Public_Sans',sans-serif] text-sm font-medium text-[#24315f]">
                Refine results with explicit filters
              </p>
              <p className="font-['Public_Sans',sans-serif] text-xs leading-5 text-slate-600">
                Change the filters, then choose{" "}
                <span className="font-semibold">Search Papers</span> when you
                are ready to apply them.
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                hasPendingFilterChanges
                  ? "border-[#dccfb8] bg-[#fffaf0] text-[#5f4d31]"
                  : "border-[#d2d9f2] bg-white text-[#24315f]"
              }
            >
              {hasPendingFilterChanges
                ? "Pending changes"
                : "Filters up to date"}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="font-['Public_Sans',sans-serif] text-sm text-[#24315f]">
                Topic area
              </Label>
              <select
                value={draftFilters.classification}
                onChange={(event) =>
                  onDraftFilterChange(
                    "classification",
                    event.target.value as PublicJournalFilters["classification"]
                  )
                }
                className="h-11 w-full rounded-md border border-[#cfd8ef] bg-white px-3 font-['Public_Sans',sans-serif] text-sm text-slate-700 shadow-sm"
              >
                <option value="">All topic areas</option>
                {availableFocusAreas.map((focusArea) => (
                  <option key={focusArea} value={focusArea}>
                    {focusArea}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-['Public_Sans',sans-serif] text-sm text-[#24315f]">
                Journal
              </Label>
              <select
                value={draftFilters.journalId}
                onChange={(event) =>
                  onDraftFilterChange("journalId", event.target.value)
                }
                className="h-11 w-full rounded-md border border-[#cfd8ef] bg-white px-3 font-['Public_Sans',sans-serif] text-sm text-slate-700 shadow-sm"
              >
                <option value="">All journals</option>
                {availableJournals.map((journal) => (
                  <option key={journal.id} value={journal.id}>
                    {journal.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-['Public_Sans',sans-serif] text-sm text-[#24315f]">
                Coverage year
              </Label>
              <select
                value={draftFilters.coverageYear}
                onChange={(event) =>
                  onDraftFilterChange("coverageYear", event.target.value)
                }
                className="h-11 w-full rounded-md border border-[#cfd8ef] bg-white px-3 font-['Public_Sans',sans-serif] text-sm text-slate-700 shadow-sm"
              >
                <option value="">All years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasAppliedFilters || hasPendingFilterChanges ? (
              <Button
                type="button"
                variant="outline"
                onClick={onClearFilters}
                className="border-[#d4c7ad] bg-[#fffaf0] text-[#5f4d31]"
              >
                Clear Filters
              </Button>
            ) : null}
          </div>
        </div>

        {validationMessage ? (
          <Alert className="border-[#e8d3a1] bg-[#fffaf0] text-[#7a4b11]">
            <Search className="size-4" />
            <AlertTitle className="font-['Public_Sans',sans-serif] text-sm">
              Add a search term or choose filters
            </AlertTitle>
            <AlertDescription className="font-['Public_Sans',sans-serif]">
              <p>{validationMessage}</p>
              <p>
                The browse view remains available below while you refine the
                search or choose filters.
              </p>
            </AlertDescription>
          </Alert>
        ) : null}

        {hasAppliedQuery || hasAppliedFilters ? (
          <div className="rounded-2xl border border-[#dccfb8] bg-[linear-gradient(135deg,#fffaf0,#f5ecda)] px-4 py-3">
            <p className="font-['Public_Sans',sans-serif] text-sm text-[#24315f]">
              {hasAppliedQuery ? (
                <>
                  Current search:{" "}
                  <span className="font-semibold">"{appliedQuery}"</span>
                </>
              ) : (
                <>Browsing all journals with applied filters.</>
              )}
            </p>
            <p className="mt-1 font-['Public_Sans',sans-serif] text-xs leading-5 text-slate-600">
              {hasAppliedFilters ? (
                <>
                  Active filters:{" "}
                  <span className="font-medium">
                    {[
                      appliedFilters.classification,
                      availableJournals.find(
                        (journal) => journal.id === appliedFilters.journalId
                      )?.title,
                      appliedFilters.coverageYear,
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </span>
                  .
                </>
              ) : null}{" "}
              Matching results stay in place until you search again or clear
              filters.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d9dff1] bg-[linear-gradient(135deg,#fbfcff,#f6f8ff)] px-4 py-3">
            <p className="font-['Public_Sans',sans-serif] text-sm text-slate-600">
              Start with a keyword if you already have a topic in mind, or keep
              browsing the published journals below.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
