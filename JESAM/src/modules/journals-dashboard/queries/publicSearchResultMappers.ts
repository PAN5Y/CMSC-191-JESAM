import type { PublicArticleSearchResult } from "../types.ts";
import { derivePublicJournalIdentity } from "./publicJournalIdentity.ts";
import {
  normalizePublicJournalFocusArea,
  sanitizeAuthors,
  toAbstractExcerpt,
} from "./publicSearchShared.ts";

export interface PublicSearchResultRow {
  journal_id: string;
  journal_title?: string | null;
  id: string;
  title: string;
  authors: unknown;
  abstract: string | null;
  classification: unknown;
  published_at: string | null;
  issue_assignment: string | null;
}

export function mapRowsToPublicArticleSearchResults(
  rows: PublicSearchResultRow[]
): PublicArticleSearchResult[] {
  return rows.map((row) => {
    const classification = normalizePublicJournalFocusArea(row.classification);
    const derivedJournal = derivePublicJournalIdentity(
      row.journal_id,
      row.journal_title
    );

    return {
      articleId: row.id,
      title: row.title,
      authors: sanitizeAuthors(row.authors),
      journalId: derivedJournal.id,
      journalTitle: derivedJournal.title,
      classification: classification ?? undefined,
      publishedAt: row.published_at,
      issueLabel: row.issue_assignment,
      abstractExcerpt: toAbstractExcerpt(row.abstract),
    } satisfies PublicArticleSearchResult;
  });
}
