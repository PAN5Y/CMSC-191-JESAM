import { supabase } from "@/lib/supabase";
import { derivePublicJournalIdentity, fetchPublicJournals } from "./publicJournals";
import type {
  PublicJournalArticlePreview,
  PublicJournalDetail,
} from "../types";
import {
  normalizePublicJournalFocusArea,
  sanitizeAuthors,
  toAbstractExcerpt,
} from "./publicSearchShared";

interface PublicArticlePreviewRow {
  journal_id: string;
  id: string;
  title: string;
  authors: unknown;
  abstract: string | null;
  classification: unknown;
  published_at: string | null;
  issue_assignment: string | null;
}

function mapArticlePreview(
  row: PublicArticlePreviewRow
): PublicJournalArticlePreview {
  const classification = normalizePublicJournalFocusArea(row.classification);

  return {
    id: row.id,
    title: row.title,
    authors: sanitizeAuthors(row.authors),
    classification: classification ?? undefined,
    abstractExcerpt: toAbstractExcerpt(row.abstract),
    publishedAt: row.published_at,
    issueLabel: row.issue_assignment,
  };
}

async function fetchJesamArticlePreviews() {
  const { data, error } = await supabase
    .from("public_journal_article_previews")
    .select(
      "journal_id, id, title, authors, abstract, classification, published_at, issue_assignment"
    )
    .order("published_at", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    throw new Error("Unable to load the public journal detail at the moment.");
  }

  return (data ?? []) as PublicArticlePreviewRow[];
}

export async function fetchPublicJournalDetail(
  journalId: string
): Promise<PublicJournalDetail | null> {
  const journals = await fetchPublicJournals();
  const journal = journals.find((entry) => entry.id === journalId);

  if (!journal) {
    return null;
  }

  const articlePreviewRows = await fetchJesamArticlePreviews();
  const articlePreviews = articlePreviewRows
    .filter((entry) => {
      const derivedJournal = derivePublicJournalIdentity(
        entry.journal_id,
        normalizePublicJournalFocusArea(entry.classification)
      );

      return derivedJournal.id === journal.id;
    })
    .map(mapArticlePreview);

  return {
    ...journal,
    articlePreviews,
  };
}
