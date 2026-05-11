import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type {
  PublicJournalFilters,
  PublicJournalFocusArea,
  PublicJournalListItem,
} from "../types";

interface JournalFilterRailProps {
  draftFilters: PublicJournalFilters;
  appliedFilters: PublicJournalFilters;
  hasAppliedFilters: boolean;
  availableJournals: PublicJournalListItem[];
  availableYears: string[];
  availableFocusAreas: PublicJournalFocusArea[];
  onDraftFilterChange: <K extends keyof PublicJournalFilters>(
    key: K,
    value: PublicJournalFilters[K]
  ) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export default function JournalFilterRail({
  draftFilters,
  appliedFilters,
  hasAppliedFilters,
  availableJournals,
  availableYears,
  availableFocusAreas,
  onDraftFilterChange,
  onApplyFilters,
  onClearFilters,
}: JournalFilterRailProps) {
  const hasPendingFilterChanges =
    draftFilters.classification !== appliedFilters.classification ||
    draftFilters.journalId !== appliedFilters.journalId ||
    draftFilters.coverageYear !== appliedFilters.coverageYear;

  return (
    <div className="lg:sticky lg:top-6">
      <Card className="overflow-hidden border-[#d8deef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfe_46%,#f5f7ff_100%)] shadow-[0_22px_55px_rgba(36,49,95,0.1)]">
        <CardHeader className="space-y-3 border-b border-[#e3e7f3] bg-[linear-gradient(135deg,#f8f9ff_0%,#fbf5e8_100%)]">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-['Newsreader',serif] text-2xl text-[#24315f]">
              Filter Results
            </CardTitle>
            <Badge
              variant="outline"
              className={
                hasPendingFilterChanges
                  ? "border-[#dccfb8] bg-[#fffaf0] text-[#5f4d31]"
                  : "border-[#d2d9f2] bg-white text-[#24315f]"
              }
            >
              {hasPendingFilterChanges ? "Pending changes" : "Filters up to date"}
            </Badge>
          </div>
          <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
            Adjust topic area, journal, or coverage year, then apply them here.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
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

          <div className="space-y-3 pt-1">
            <Button
              type="button"
              onClick={onApplyFilters}
              className="w-full bg-[#24315f] text-white hover:bg-[#1e294f]"
            >
              Search with Filters
            </Button>
            {hasAppliedFilters || hasPendingFilterChanges ? (
              <Button
                type="button"
                variant="outline"
                onClick={onClearFilters}
                className="w-full border-[#d4c7ad] bg-[#fffaf0] text-[#5f4d31]"
              >
                Clear Filters
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
