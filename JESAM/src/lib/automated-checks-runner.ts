import type { AutomatedCheckSnapshot } from "@/types";

/** Same threshold as intake (`AutomatedChecks.tsx`). */
export const SIMILARITY_THRESHOLD_PERCENT = 30;

type CheckKey = keyof AutomatedCheckSnapshot;

function parseSimilarityPercent(message: string): number | undefined {
  const m = message.match(/(\d+(?:\.\d+)?)%/);
  if (m) return parseFloat(m[1]);
  return undefined;
}

/** Simulated intake checks for revised files (proposal §2.1-style QA). */
export async function runAutomatedChecksSimulation(
  file: File,
  onProgress?: (partial: AutomatedCheckSnapshot) => void
): Promise<{ checks: AutomatedCheckSnapshot; similarityScore: number; pass: boolean }> {
  void file;

  let checks: AutomatedCheckSnapshot = {
    formatting: { status: "pending", message: "" },
    assets: { status: "pending", message: "" },
    plagiarism: { status: "pending", message: "" },
  };

  const setPhase = (key: CheckKey, status: string, message: string) => {
    checks = { ...checks, [key]: { status, message } };
    onProgress?.(checks);
  };

  setPhase("formatting", "checking", "Verifying template adherence...");
  await new Promise((r) => setTimeout(r, 1500));
  setPhase("formatting", "passed", "Template adherence verified. All formatting requirements met.");

  setPhase("assets", "checking", "Validating figures and assets...");
  await new Promise((r) => setTimeout(r, 1500));
  setPhase("assets", "passed", "All figures meet resolution requirements. Blinding status confirmed.");

  setPhase("plagiarism", "checking", "Running similarity screening...");
  await new Promise((r) => setTimeout(r, 2000));
  const similarityIndex = Math.floor(Math.random() * 35) + 5;
  if (similarityIndex <= SIMILARITY_THRESHOLD_PERCENT) {
    setPhase(
      "plagiarism",
      "passed",
      `Similarity index: ${similarityIndex}%. Within acceptable threshold (${SIMILARITY_THRESHOLD_PERCENT}% or below).`
    );
  } else {
    setPhase(
      "plagiarism",
      "failed",
      `Similarity index: ${similarityIndex}%. Exceeds ${SIMILARITY_THRESHOLD_PERCENT}% threshold. Please revise overlapping sections and resubmit.`
    );
  }

  const similarityScore = parseSimilarityPercent(checks.plagiarism.message) ?? similarityIndex;
  const pass =
    checks.formatting.status === "passed" &&
    checks.assets.status === "passed" &&
    checks.plagiarism.status === "passed";

  return { checks, similarityScore, pass };
}
