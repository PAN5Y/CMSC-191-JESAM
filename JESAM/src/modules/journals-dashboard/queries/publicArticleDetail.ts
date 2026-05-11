import { supabase } from "@/lib/supabase";
import { derivePublicJournalIdentity } from "./publicJournals";
import type {
  PublicArticleDetail,
  PublicArticleDownloadAvailabilityStatus,
} from "../types";
import {
  normalizePublicJournalFocusArea,
  toOptionalSummaryText,
  sanitizeAuthors,
  sanitizeKeywords,
} from "./publicSearchShared";
import {
  LEGACY_PUBLIC_ARTICLE_DETAIL_SELECT,
  PUBLIC_ARTICLE_DETAIL_SELECT,
  shouldRetryLegacyPublicArticleDetailQuery,
} from "./publicArticleDetailContract";

interface PublicArticleDetailRow {
  journal_id: string;
  journal_title?: string | null;
  id: string;
  title: string;
  authors: unknown;
  abstract: string | null;
  summary?: string | null;
  classification: unknown;
  published_at: string | null;
  issue_assignment: string | null;
  doi?: string | null;
  keywords?: unknown;
  download_availability_status?: string | null;
  is_downloadable?: boolean | null;
  download_url?: string | null;
}

function normalizeDownloadAvailabilityStatus(
  value: string | null | undefined
): PublicArticleDownloadAvailabilityStatus {
  return value === "available" ||
    value === "unavailable" ||
    value === "unknown" ||
    value === "temporary-failure"
    ? value
    : "unknown";
}

async function fetchPublicArticleDetailRows(articleId: string) {
  const { data, error } = await supabase
    .from("public_journal_article_details")
    .select(PUBLIC_ARTICLE_DETAIL_SELECT)
    .eq("id", articleId)
    .limit(1);

  if (!error) {
    return (data ?? []) as unknown as PublicArticleDetailRow[];
  }

  if (!shouldRetryLegacyPublicArticleDetailQuery(error)) {
    throw new Error("Unable to load the public article detail at the moment.");
  }

  const legacyResponse = await supabase
    .from("public_journal_article_details")
    .select(LEGACY_PUBLIC_ARTICLE_DETAIL_SELECT)
    .eq("id", articleId)
    .limit(1);

  if (legacyResponse.error) {
    throw new Error("Unable to load the public article detail at the moment.");
  }

  return (legacyResponse.data ?? []) as unknown as PublicArticleDetailRow[];
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
    summary: toOptionalSummaryText(row.summary),
    classification: classification ?? undefined,
    publishedAt: row.published_at,
    issueLabel: row.issue_assignment,
    doi: row.doi ?? undefined,
    keywords: sanitizeKeywords(row.keywords),
    downloadAvailabilityStatus: normalizeDownloadAvailabilityStatus(
      row.download_availability_status
    ),
    isDownloadable: row.is_downloadable === true,
    downloadUrl: row.download_url ?? undefined,
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
