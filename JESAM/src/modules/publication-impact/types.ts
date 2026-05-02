/**
 * Re-export shared types from the project single source of truth.
 * @see src/types.ts
 */
export type {
  ManuscriptStatus,
  AppRole,
  UserProfile,
  JournalClassification,
  ManuscriptMetrics,
  Manuscript,
  ReadinessStatus,
  SubmissionMetadata,
  SubmissionAuthorDetail,
} from "@/types";

export { PUBLICATION_PIPELINE_STATUSES, normalizeManuscriptRow, parseAuthors, parseKeywords } from "@/types";
