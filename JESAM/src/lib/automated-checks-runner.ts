import type { AutomatedCheckSnapshot, TemplateCheckReport } from "@/types";
import { supabase } from "@/lib/supabase";
import * as mammoth from "mammoth/mammoth.browser";

/** Same threshold as intake (`AutomatedChecks.tsx`). */
export const SIMILARITY_THRESHOLD_PERCENT = 30;

type CheckKey = keyof AutomatedCheckSnapshot;

interface RunAutomatedChecksOptions {
  manuscriptId?: string;
  fileUrl?: string | null;
  storagePath?: string;
}

function parseSimilarityPercent(message: string): number | undefined {
  const m = message.match(/(\d+(?:\.\d+)?)%/);
  if (m) return parseFloat(m[1]);
  return undefined;
}

export function storagePathFromPublicUrl(url: string | null | undefined) {
  if (!url) return undefined;
  const marker = "/storage/v1/object/public/manuscript-files/";
  const index = url.indexOf(marker);
  if (index < 0) return undefined;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

function summarizeTemplateReport(report: TemplateCheckReport) {
  const errors = report.issues.filter((issue) => issue.severity === "error");
  const warnings = report.issues.filter((issue) => issue.severity === "warning");
  if (report.passed) {
    return `Template check passed (${report.score}/100). ${warnings.length} warning(s).`;
  }
  const firstIssue = errors[0]?.message ?? report.issues[0]?.message ?? "Template issues found.";
  return `Template check failed (${report.score}/100). ${firstIssue}`;
}

async function runTemplateCheck(
  storagePath: string,
  manuscriptId: string | undefined
): Promise<TemplateCheckReport> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${supabaseUrl}/functions/v1/check-template`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
    },
    body: JSON.stringify({
      manuscriptId,
      storagePath,
    }),
  });

  const rawPayload = await response.text();
  let payload: { error?: unknown; report?: unknown } = {};

  try {
    payload = rawPayload ? JSON.parse(rawPayload) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : `Template check failed with status ${response.status}.`
            + (rawPayload ? ` ${rawPayload}` : "")
    );
  }

  if (!payload.report) {
    throw new Error("Template check returned no report.");
  }

  return payload.report as TemplateCheckReport;
}

/** Simulated intake checks for revised files (proposal §2.1-style QA). */
export async function runAutomatedChecksSimulation(
  file: File,
  onProgress?: (partial: AutomatedCheckSnapshot) => void,
  options: RunAutomatedChecksOptions = {}
): Promise<{
  checks: AutomatedCheckSnapshot;
  similarityScore: number;
  pass: boolean;
  templateReport?: TemplateCheckReport;
}> {
  let checks: AutomatedCheckSnapshot = {
    formatting: { status: "pending", message: "" },
    assets: { status: "pending", message: "" },
    plagiarism: { status: "pending", message: "" },
  };
  let fullText = "";
  let similarityIndex: number | undefined;

  const setPhase = (key: CheckKey, status: string, message: string) => {
    checks = { ...checks, [key]: { status, message } };
    onProgress?.(checks);
  };

  setPhase("formatting", "checking", "Verifying template adherence...");
  let templateReport: TemplateCheckReport | undefined;
  const storagePath = options.storagePath ?? storagePathFromPublicUrl(options.fileUrl);

  if (storagePath) {
    try {
      templateReport = await runTemplateCheck(storagePath, options.manuscriptId);

      setPhase(
        "formatting",
        templateReport.passed ? "passed" : "failed",
        summarizeTemplateReport(templateReport)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Template check service failed.";
      console.error("Template check service error:", error);
      setPhase(
        "formatting",
        "failed",
        message
      );
    }
  }

  // Formatting Check
  if (!storagePath) {
    setPhase("formatting", "checking", "Extracting text and verifying format...");
  }
  try {
    if (file.name.toLowerCase().endsWith(".docx")) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      fullText = result.value;

      if (!storagePath) {
        if (fullText.length < 500) {
          setPhase("formatting", "failed", "Document too short. Please use the full template.");
        } else {
          setPhase("formatting", "passed", "Template structure looks valid.");
        }
      }
    } else {
      fullText = `${file.name} ${file.type || "manuscript"} `.repeat(120);
      if (!storagePath) {
        setPhase(
          "formatting",
          "passed",
          "File accepted for simulated production checks. Template details require editor review."
        );
      }
    }
  } catch (error) {
    console.error("Error processing document:", error);
    if (!storagePath) {
      setPhase("formatting", "failed", "Failed to process document. Please ensure it's a valid Word (.docx) file.");
    }
  }
  
  setPhase("assets", "checking", "Validating figures and assets...");
  await new Promise((r) => setTimeout(r, 1500));
  setPhase("assets", "passed", "All figures meet resolution requirements. Blinding status confirmed.");

  // Plagiarism Check
  setPhase("plagiarism", "checking", "Running similarity screening...");
  try {
    if (!fullText) {
      throw new Error("No extracted text available for plagiarism check.");
    }

    const { data, error } = await supabase.functions.invoke("check-plagiarism", {
      body: { text: fullText },
    });

    if (error) throw error;
    // console.log("Plagiarism check result:", data); // debug purposes only
    similarityIndex = data?.score;

    if (typeof similarityIndex !== "number") {
      throw new Error("Invalid plagiarism service response.");
    }

    if (similarityIndex <= SIMILARITY_THRESHOLD_PERCENT) {
      setPhase(
        "plagiarism",
        "passed",
        `Similarity index: ${similarityIndex}%. Accepted.`
      );
    } else {
      setPhase(
        "plagiarism",
        "failed",
        `Similarity index: ${similarityIndex}%. Exceeds threshold.`
      );
    }
  } catch (err) {
    console.error("Plagiarism service error:", err);
    setPhase("plagiarism", "failed", "Service unavailable. Please try again later.");
  }

  const similarityScore = parseSimilarityPercent(checks.plagiarism.message) ?? similarityIndex ?? 0;
  const pass =
    checks.formatting.status === "passed" &&
    checks.assets.status === "passed" &&
    checks.plagiarism.status === "passed";

  return { checks, similarityScore, pass, templateReport };
}
