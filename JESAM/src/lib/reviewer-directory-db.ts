import { supabase } from "@/lib/supabase";
import type { ReviewerCandidate } from "@/lib/reviewer-suggestions";
import type { JournalClassification } from "@/types";
import { parseClassification } from "@/types";

function displayName(row: {
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  email?: string | null;
}): string {
  const parts = [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  return row.email?.split("@")[0] ?? "Reviewer";
}

/**
 * Registered users with role `reviewer`. Invitation email must match auth login for Reviewer Portal.
 * Optional `profiles.review_expertise` (Land/Air/Water/People) drives ranking.
 */
export async function listReviewerCandidatesFromDb(): Promise<{
  data: ReviewerCandidate[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("profiles")
    .select("email, first_name, middle_name, last_name, role, review_expertise")
    .eq("role", "reviewer");

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const rows = (data ?? []).filter((r) => typeof r.email === "string" && r.email.trim().length > 0);

  const seen = new Set<string>();
  const mapped: ReviewerCandidate[] = [];
  for (const r of rows) {
    const email = String(r.email).trim().toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);

    const parsed = parseClassification(r.review_expertise);
    const expertise: JournalClassification = parsed ?? "Land";

    mapped.push({
      reviewerEmail: email,
      reviewerName: displayName(r),
      expertise,
    });
  }

  return { data: mapped, error: null };
}
