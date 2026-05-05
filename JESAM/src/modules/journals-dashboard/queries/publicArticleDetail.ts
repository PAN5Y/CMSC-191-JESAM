import { supabase } from "@/lib/supabase";
import { derivePublicJournalIdentity } from "./publicJournals";
import type { PublicArticleDetail } from "../types";
import {
  normalizePublicJournalFocusArea,
  sanitizeAuthors,
  sanitizeKeywords,
} from "./publicSearchShared";

interface PublicArticleDetailRow {
  journal_id: string;
  journal_title?: string | null;
  id: string;
  title: string;
  authors: unknown;
  abstract: string | null;
  classification: unknown;
  published_at: string | null;
  issue_assignment: string | null;
  doi?: string | null;
  keywords?: unknown;
}

async function fetchPublicArticleDetailRows(articleId: string) {
  const { data, error } = await supabase
    .from("public_journal_article_details")
    .select(
      "journal_id, journal_title, id, title, authors, abstract, classification, published_at, issue_assignment, doi, keywords"
    )
    .eq("id", articleId)
    .limit(1);

  if (error) {
    throw new Error("Unable to load the public article detail at the moment.");
  }

  return (data ?? []) as PublicArticleDetailRow[];
}

function mapArticleDetail(row: PublicArticleDetailRow): PublicArticleDetail {
  const classification = normalizePublicJournalFocusArea(row.classification);
  const derivedJournal = derivePublicJournalIdentity(
    row.journal_id,
    classification,
    row.journal_title
  );

  return {
    id: row.id,
    journalId: derivedJournal.id,
    journalTitle: derivedJournal.title,
    title: row.title,
    authors: sanitizeAuthors(row.authors),
    abstract: row.abstract ?? undefined,
    classification: classification ?? undefined,
    publishedAt: row.published_at,
    issueLabel: row.issue_assignment,
    doi: row.doi ?? undefined,
    keywords: sanitizeKeywords(row.keywords),
  };
}

export async function fetchPublicArticleDetail(articleId: string) {
  const rows = await fetchPublicArticleDetailRows(articleId);
  const [row] = rows;

  if (!row) {
    return null;
  }

  return mapArticleDetail(row);
}
