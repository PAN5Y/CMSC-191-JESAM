/**
 * chatbot-search.ts
 *
 * Lightweight Supabase query used exclusively by the AI Chatbot module to
 * search the JESAM manuscript repository on behalf of a user query.
 */

import { supabase } from "@/lib/supabase";
import type { ManuscriptSearchResult } from "../types";

/**
 * Regex patterns that signal the user wants a literature search.
 * Intentionally liberal — better to search and find nothing than to miss intent.
 */
const SEARCH_TRIGGERS = [
  /\bfind\b.*\bpaper/i,
  /\bsearch\b.*\b(paper|article|manuscript|literature|study|studies)/i,
  /\brelated\b.*\b(paper|article|literature)/i,
  /\b(paper|article|manuscript)s?\b.*\b(on|about|regarding|related to)\b/i,
  /\bliterature\b.*\bon\b/i,
  /\bshow me\b.*\bpaper/i,
  /\bany\b.*\b(paper|article)s?\b.*\bon\b/i,
];

/**
 * Returns true when the user message appears to be requesting a manuscript search.
 */
export function hasSearchIntent(message: string): boolean {
  return SEARCH_TRIGGERS.some((re) => re.test(message));
}

/**
 * Extracts a short search term from a natural-language query.
 *
 * Strategy: strip common filler words and return the remaining content after
 * the trigger phrase.  This is deliberately simple — the Supabase ilike
 * query is forgiving enough that broad terms work well.
 *
 * Example:
 *   "Find papers on water quality and watershed management"
 *   → "water quality and watershed management"
 */
export function extractSearchTerm(message: string): string {
  // Strip common preamble phrases
  const stripped = message
    .replace(/^(find|search for?|look for?|show me|are there any|do you have|get me)\s+/i, "")
    .replace(/\b(papers?|articles?|manuscripts?|studies|literature)\b/gi, "")
    .replace(/\b(on|about|regarding|related to|concerning)\b/gi, "")
    .replace(/\bin (the\s+)?(jesam\s+)?(repository|archive|database|journal)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Fallback to the whole message if stripping ate everything
  return stripped.length > 2 ? stripped : message.trim();
}

/**
 * Searches the `manuscripts` table in Supabase using a case-insensitive
 * LIKE query on the title column.
 *
 * Returns up to 5 results matching the Published/Accepted statuses so we
 * only surface real journal content, not in-progress submissions.
 *
 * @param query - The cleaned search term extracted from the user's message
 */
export async function searchManuscripts(
  query: string
): Promise<ManuscriptSearchResult[]> {
  // We search title with ilike for broad, forgiving matching.
  // A production version might use pg_trgm or a dedicated FTS index.
  const terms = query
    .split(/\s+and\s+|\s*,\s*/i)
    .map((t) => t.trim())
    .filter(Boolean);

  // Build OR conditions: title ilike '%term1%' or title ilike '%term2%'
  // Supabase JS v2 supports .or() with comma-separated filters
  const orFilter = terms
    .map((t) => `title.ilike.%${t}%`)
    .join(",");

  const { data, error } = await supabase
    .from("manuscripts")
    .select("id, reference_code, title, submission_metadata, status, classification")
    .in("status", ["Published", "Accepted", "In Production"])
    .or(orFilter)
    .limit(5);

  if (error || !data) return [];

  return data.map((row) => {
    // Extract author names from submission_metadata JSON
    let authors: string[] = [];
    try {
      const meta =
        typeof row.submission_metadata === "string"
          ? JSON.parse(row.submission_metadata)
          : row.submission_metadata;
      if (Array.isArray(meta?.authors)) {
        authors = meta.authors.map(
          (a: { name?: string; first_name?: string; last_name?: string }) =>
            a.name ?? `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()
        );
      }
    } catch {
      // malformed metadata — leave authors empty
    }

    return {
      id: row.id as string,
      referenceCode: (row.reference_code as string) ?? row.id,
      title: row.title as string,
      authors,
      classification: (row.classification as string) ?? "—",
      status: row.status as string,
    };
  });
}
