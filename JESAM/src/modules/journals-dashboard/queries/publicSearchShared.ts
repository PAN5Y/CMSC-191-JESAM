import type { PublicJournalFocusArea } from "../types";

export const MAX_ABSTRACT_PREVIEW_LENGTH = 220;

export function normalizePublicJournalFocusArea(
  value: unknown
): PublicJournalFocusArea | null {
  return value === "Land" || value === "Air" || value === "Water" || value === "People"
    ? value
    : null;
}

export function sanitizeAuthors(value: unknown) {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      if (
        typeof entry === "object" &&
        entry !== null &&
        "name" in entry &&
        typeof entry.name === "string"
      ) {
        return entry.name;
      }

      return null;
    })
    .filter((entry): entry is string => Boolean(entry));
}

export function sanitizeKeywords(value: unknown) {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function toAbstractExcerpt(abstract: string | null) {
  if (!abstract) {
    return undefined;
  }

  const trimmed = abstract.trim();

  if (trimmed.length <= MAX_ABSTRACT_PREVIEW_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, MAX_ABSTRACT_PREVIEW_LENGTH).trimEnd()}...`;
}

export function toOptionalSummaryText(summary: string | null | undefined) {
  if (typeof summary !== "string") {
    return undefined;
  }

  const trimmed = summary.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}
