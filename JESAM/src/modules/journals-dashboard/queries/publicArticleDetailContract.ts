export const PUBLIC_ARTICLE_DETAIL_SELECT = [
  "journal_id",
  "journal_title",
  "id",
  "title",
  "authors",
  "abstract",
  "summary",
  "classification",
  "published_at",
  "issue_assignment",
  "doi",
  "keywords",
  "download_availability_status",
  "is_downloadable",
  "download_url",
].join(", ");

export const LEGACY_PUBLIC_ARTICLE_DETAIL_SELECT = [
  "journal_id",
  "journal_title",
  "id",
  "title",
  "authors",
  "abstract",
  "classification",
  "published_at",
  "issue_assignment",
  "doi",
  "keywords",
].join(", ");

interface PublicArticleDetailContractError {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
}

const LEGACY_RETRY_ERROR_CODES = new Set(["42703", "PGRST204"]);

export function shouldRetryLegacyPublicArticleDetailQuery(
  error: PublicArticleDetailContractError
) {
  const code = error.code?.toUpperCase() ?? "";
  const diagnosticText = [error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === "string")
    .join("\n")
    .toLowerCase();

  if (
    !["summary", "download_availability_status", "is_downloadable", "download_url"].some(
      (fieldName) => diagnosticText.includes(fieldName)
    )
  ) {
    return false;
  }

  return code.length === 0 || LEGACY_RETRY_ERROR_CODES.has(code);
}
