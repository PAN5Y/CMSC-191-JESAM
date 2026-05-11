import { AlertCircle } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PublicRecoveryStateProps {
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionTo?: string;
  onSecondaryAction?: () => void;
}

export function PublicRecoveryState({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  secondaryActionTo,
  onSecondaryAction,
}: PublicRecoveryStateProps) {
  return (
    <Card className="border-[#efd1d1] bg-[linear-gradient(180deg,#ffffff,#fff7f6)] shadow-sm">
      <CardContent className="flex flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-2xl gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fff2f2] text-[#b13d3d]">
            <AlertCircle className="size-5" />
          </div>
          <div className="space-y-2">
            <h2 className="font-['Newsreader',serif] text-2xl text-[#7f2525]">
              {title}
            </h2>
            <p className="font-['Public_Sans',sans-serif] text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {primaryActionLabel && onPrimaryAction ? (
            <Button
              onClick={onPrimaryAction}
              className="bg-[#24315f] text-white hover:bg-[#1e294f]"
            >
              {primaryActionLabel}
            </Button>
          ) : null}
          {secondaryActionLabel && secondaryActionTo ? (
            <Button asChild variant="outline">
              <Link to={secondaryActionTo}>{secondaryActionLabel}</Link>
            </Button>
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
