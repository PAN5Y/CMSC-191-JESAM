import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { attemptPublicArticleDownload } from "../queries/publicArticleDownload";
import { PublicRecoveryState } from "./PublicRecoveryState";
import type { PublicArticleDownloadAvailabilityStatus } from "../types";

interface DownloadAvailabilityStateProps {
  status: PublicArticleDownloadAvailabilityStatus;
  isDownloadable: boolean;
  downloadUrl?: string;
}

function getAvailabilityCopy(status: PublicArticleDownloadAvailabilityStatus) {
  switch (status) {
    case "available":
      return {
        description: "Public PDF available.",
      };
    case "unavailable":
      return {
        description: "No public PDF for this paper.",
      };
    case "temporary-failure":
      return {
        description: "File check unavailable right now.",
      };
    default:
      return {
        description: "File status not confirmed.",
      };
  }
}

export function DownloadAvailabilityState({
  status,
  isDownloadable,
  downloadUrl,
}: DownloadAvailabilityStateProps) {
  const [isAttemptingDownload, setIsAttemptingDownload] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const copy = getAvailabilityCopy(status);
  const canAttemptDownload = status === "available" && isDownloadable && downloadUrl;

  const handleDownload = async () => {
    if (!canAttemptDownload) {
      return;
    }

    setIsAttemptingDownload(true);
    setDownloadError(null);

    try {
      const result = await attemptPublicArticleDownload(downloadUrl);

      if (!result.ok) {
        setDownloadError(result.message);
      }
    } finally {
      setIsAttemptingDownload(false);
    }
  };

  if (downloadError) {
    return (
      <PublicRecoveryState
        title="Download could not be started"
        description={downloadError}
        primaryActionLabel="Try Download Again"
        onPrimaryAction={handleDownload}
      />
    );
  }

  return (
      <Card className="border-[#ddd3c1] bg-[linear-gradient(180deg,#fffdf9,#f4ecdd)] shadow-[0_18px_44px_rgba(175,145,94,0.08)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#24315f]">
            <FileDown className="size-4" />
            <CardTitle className="font-['Newsreader',serif] text-2xl text-[#24315f]">
              Download
            </CardTitle>
          </div>
          <Badge
            className={
              status === "available"
                ? "bg-[#eef7f0] text-[#245336] hover:bg-[#eef7f0]"
                : "bg-white/90 text-[#5f4d31] hover:bg-white/90"
            }
          >
            {status.replace("-", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-['Public_Sans',sans-serif] text-sm text-slate-700">
          {copy.description}
        </p>
        {canAttemptDownload ? (
          <Button
            onClick={() => void handleDownload()}
            disabled={isAttemptingDownload}
            className="bg-[#24315f] text-white hover:bg-[#1e294f]"
          >
            {isAttemptingDownload ? (
              <>
                <Loader2 className="animate-spin" />
                Starting download
              </>
            ) : (
              <>
                <FileDown />
                Download PDF
              </>
            )}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
