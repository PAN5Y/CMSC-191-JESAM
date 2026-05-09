import type { AutomatedCheckSnapshot } from "@/types";
import { supabase } from "@/lib/supabase";
import * as mammoth from "mammoth/mammoth.browser";

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
  let fullText = "";
  let similarityIndex: number | undefined;

  const setPhase = (key: CheckKey, status: string, message: string) => {
    checks = { ...checks, [key]: { status, message } };
    onProgress?.(checks);
  };

  setPhase("formatting", "checking", "Verifying template adherence...");
  await new Promise((r) => setTimeout(r, 1500));
  setPhase("formatting", "passed", "Template adherence verified. All formatting requirements met.");

  // Formatting Check
  setPhase("formatting", "checking", "Extracting text and verifying format...");
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    fullText = result.value;

    // Sample template check for testing only
    if (fullText.length < 500) {
      setPhase("formatting", "failed", "Document too short. Please use the full template.");
    } else {
      setPhase("formatting", "passed", "Template structure looks valid.");
    }
  } catch (error) {
    console.error("Error processing document:", error);
    setPhase("formatting", "failed", "Failed to process document. Please ensure it's a valid Word (.docx) file.");
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

  return { checks, similarityScore, pass };
}
