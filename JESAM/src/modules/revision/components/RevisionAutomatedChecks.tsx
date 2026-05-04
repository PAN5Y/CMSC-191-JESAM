import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Image, Loader2, XCircle } from "lucide-react";
import type { AutomatedCheckSnapshot } from "@/types";
import {
  runAutomatedChecksSimulation,
  SIMILARITY_THRESHOLD_PERCENT,
} from "@/lib/automated-checks-runner";

type CheckStatus = "pending" | "checking" | "passed" | "failed";

interface RevisionAutomatedChecksProps {
  file: File | null;
  manuscriptKey: string;
  onResult: (result: { checks: AutomatedCheckSnapshot; pass: boolean; similarityScore: number } | null) => void;
}

export function RevisionAutomatedChecks({ file, manuscriptKey, onResult }: RevisionAutomatedChecksProps) {
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const [checks, setChecks] = useState<AutomatedCheckSnapshot>({
    formatting: { status: "pending", message: "" },
    assets: { status: "pending", message: "" },
    plagiarism: { status: "pending", message: "" },
  });
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!file) {
      setChecks({
        formatting: { status: "pending", message: "" },
        assets: { status: "pending", message: "" },
        plagiarism: { status: "pending", message: "" },
      });
      onResultRef.current(null);
      return;
    }

    let cancelled = false;
    setRunning(true);
    onResultRef.current(null);
    setChecks({
      formatting: { status: "checking", message: "Verifying template adherence..." },
      assets: { status: "pending", message: "" },
      plagiarism: { status: "pending", message: "" },
    });

    void runAutomatedChecksSimulation(file, (partial) => {
      if (!cancelled) setChecks(partial);
    }).then((out) => {
      if (cancelled) return;
      setRunning(false);
      setChecks(out.checks);
      onResultRef.current({ checks: out.checks, pass: out.pass, similarityScore: out.similarityScore });
    });

    return () => {
      cancelled = true;
    };
  }, [file, manuscriptKey]);

  const getStatusIcon = (status: string) => {
    switch (status as CheckStatus) {
      case "checking":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "passed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status as CheckStatus) {
      case "checking":
        return "border-blue-200 bg-blue-50";
      case "passed":
        return "border-green-200 bg-green-50";
      case "failed":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  if (!file) return null;

  const allPassed =
    checks.formatting.status === "passed" &&
    checks.assets.status === "passed" &&
    checks.plagiarism.status === "passed";

  return (
    <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50/80">
      <div>
        <h4 className="font-semibold text-gray-900">Automated checks (revised file)</h4>
        <p className="text-xs text-gray-600 mt-1">
          Same simulated gates as new submission: formatting, assets, similarity (threshold{" "}
          {SIMILARITY_THRESHOLD_PERCENT}%). Editors may still verify manually.
        </p>
      </div>

      <div className={`p-3 border rounded-lg ${getStatusColor(checks.formatting.status)}`}>
        <div className="flex items-start gap-2">
          {getStatusIcon(checks.formatting.status)}
          <div>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <FileText className="w-4 h-4" /> Formatting
            </p>
            {checks.formatting.message ? (
              <p className="text-xs text-gray-700 mt-1">{checks.formatting.message}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`p-3 border rounded-lg ${getStatusColor(checks.assets.status)}`}>
        <div className="flex items-start gap-2">
          {getStatusIcon(checks.assets.status)}
          <div>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <Image className="w-4 h-4" /> Assets
            </p>
            {checks.assets.message ? (
              <p className="text-xs text-gray-700 mt-1">{checks.assets.message}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`p-3 border rounded-lg ${getStatusColor(checks.plagiarism.status)}`}>
        <div className="flex items-start gap-2">
          {getStatusIcon(checks.plagiarism.status)}
          <div>
            <p className="text-sm font-medium text-gray-900">Similarity</p>
            {checks.plagiarism.message ? (
              <p className="text-xs text-gray-700 mt-1">{checks.plagiarism.message}</p>
            ) : null}
          </div>
        </div>
      </div>

      {running && (
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Running checks…
        </p>
      )}
      {!running && allPassed && (
        <p className="text-xs font-medium text-green-800">All checks passed — you can submit this revision.</p>
      )}
      {!running && !allPassed && checks.plagiarism.status === "failed" && (
        <p className="text-xs text-red-800">Similarity or other checks failed — fix the file and upload again.</p>
      )}
    </div>
  );
}
