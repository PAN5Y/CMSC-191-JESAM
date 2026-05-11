import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryPanelProps {
  summary: string;
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  return (
    <Card className="border-[#d7dff1] bg-[linear-gradient(180deg,#fdfefe,#edf5ff)] shadow-[0_18px_44px_rgba(36,49,95,0.08)]">
      <CardHeader className="pb-3">
        <CardTitle className="font-['Newsreader',serif] text-3xl text-[#1d2548]">
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-['Public_Sans',sans-serif] text-sm leading-7 text-slate-700 sm:text-base">
          {summary}
        </p>
      </CardContent>
    </Card>
  );
}
