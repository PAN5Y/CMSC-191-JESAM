import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * Copies `review_expertise` from Auth user_metadata into public.profiles.
 * Use when the DB trigger that creates the profile row does not map this field
 * (common if the trigger predates profiles.review_expertise).
 */
export async function syncReviewExpertiseFromAuthMetadata(user: User): Promise<void> {
  const raw = user.user_metadata?.review_expertise;
  if (typeof raw !== "string" || !raw.trim()) return;

  const { error } = await supabase
    .from("profiles")
    .update({ review_expertise: raw.trim() })
    .eq("id", user.id);

  if (error && import.meta.env.DEV) {
    console.warn("[profile-sync] review_expertise update failed:", error.message);
  }
}
