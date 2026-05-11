import { supabase } from "@/lib/supabase";
import type {
  PublicJournalFocusArea,
  PublicJournalListItem,
} from "../types";
import { derivePublicJournalIdentity as derivePublicJournalIdentityFromRow } from "./publicJournalIdentity";

interface PublicJournalListingRow {
  journal_id: string;
  journal_title: string;
  journal_description: string;
  institution: string;
  issn: string | null;
  access_label: string;
  classification: unknown;
  issue_assignment: string | null;
  published_at: string | null;
}

function isPublicJournalFocusArea(
  value: unknown
): value is PublicJournalFocusArea {
  return value === "Land" || value === "Air" || value === "Water" || value === "People";
}

function normalizePublicJournalFocusArea(
  value: unknown
): PublicJournalFocusArea | null {
  return isPublicJournalFocusArea(value) ? value : null;
}

function isValidPublishedDate(value: string | null) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function dedupeFocusAreas(
  rows: PublicJournalListingRow[]
): PublicJournalFocusArea[] {
  return Array.from(
    new Set(
      rows
        .map((row) => normalizePublicJournalFocusArea(row.classification))
        .filter((value): value is PublicJournalFocusArea => value !== null)
    )
  );
}

function getCoverageYears(rows: PublicJournalListingRow[]) {
  return Array.from(
    new Set(
      rows
        .map((row) => row.published_at)
        .filter((value): value is string => isValidPublishedDate(value))
        .map((date) => new Date(date).getFullYear())
        .filter((year) => Number.isFinite(year))
    )
  ).sort((a, b) => b - a);
}

function getLatestPublishedAt(rows: PublicJournalListingRow[]) {
  const publishedDates = rows
    .map((row) => row.published_at)
    .filter((value): value is string => isValidPublishedDate(value))
    .sort((left, right) => Date.parse(right) - Date.parse(left));

  return publishedDates[0] ?? null;
}

function getLatestIssueLabel(rows: PublicJournalListingRow[]) {
  const latestRow = rows
    .filter((row) => isValidPublishedDate(row.published_at))
    .sort((left, right) =>
      Date.parse(right.published_at ?? "") - Date.parse(left.published_at ?? "")
    )[0];

  return latestRow?.issue_assignment ?? null;
}

function mapRowsToPublicJournals(rows: PublicJournalListingRow[]) {
  const groupedRows = new Map<string, PublicJournalListingRow[]>();

  for (const row of rows) {
    const journalRows = groupedRows.get(row.journal_id) ?? [];
    journalRows.push(row);
    groupedRows.set(row.journal_id, journalRows);
  }

  return Array.from(groupedRows.entries()).map(([, journalRows]) => {
    const [journal] = journalRows;
    const publishedRows = journalRows.filter((row) =>
      isValidPublishedDate(row.published_at)
    );
    const derivedJournal = derivePublicJournalIdentityFromRow(
      journal.journal_id,
      journal.journal_title,
      journal.journal_description,
      journal.institution,
      journal.issn,
      journal.access_label
    );

    return {
      id: derivedJournal.id,
      title: derivedJournal.title,
      description: derivedJournal.description,
      institution: derivedJournal.institution,
      issn: derivedJournal.issn ?? undefined,
      accessLabel: derivedJournal.accessLabel,
      focusAreas: dedupeFocusAreas(publishedRows),
      totalPublishedArticles: publishedRows.length,
      latestPublicationDate: getLatestPublishedAt(publishedRows),
      latestIssueLabel: getLatestIssueLabel(publishedRows),
      coverageYears: getCoverageYears(publishedRows),
    } satisfies PublicJournalListItem;
  });
}

export async function fetchPublicJournals(): Promise<PublicJournalListItem[]> {
  const { data, error } = await supabase
    .from("public_journal_listing")
    .select(
      "journal_id, journal_title, journal_description, institution, issn, access_label, classification, issue_assignment, published_at"
    )
    .order("journal_id", { ascending: true })
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load the public journal archive at the moment.");
  }

  return mapRowsToPublicJournals((data ?? []) as PublicJournalListingRow[]);
}

export function derivePublicJournalIdentity(
  journalId: string,
  _classification: PublicJournalFocusArea | null,
  journalTitle?: string | null
) {
  return derivePublicJournalIdentityFromRow(journalId, journalTitle);
}
