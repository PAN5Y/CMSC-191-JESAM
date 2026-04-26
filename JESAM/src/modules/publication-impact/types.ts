
export type ManuscriptStatus =
  | "Accepted"
  | "In Production"
  | "Published"
  | "Return to Revision"
  | "Retracted";

export type AppRole =
  | "author"
  | "reviewer"
  | "associate_editor"
  | "managing_editor"
  | "production_editor"
  | "editor_in_chief"
  | "system_admin";

// Matches the 'profiles' table in Supabase (app_role ENUM)
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  affiliation?: string;
  orcid_id?: string;
  role: AppRole;
  created_at: string;
}

export type JournalClassification = "Land" | "Air" | "Water" | "People";

// Matches the 'article_metrics' table in Supabase
export interface ManuscriptMetrics {
  id?: string;
  manuscript_id?: string;
  views: number;
  downloads: number;
  citations: number;
  last_updated?: string;
}

// Matches the 'manuscripts' table in Supabase
export interface Manuscript {
  id: string; // Now expects a Supabase UUID
  submitter_id?: string; // Foreign key to profiles.id / auth.users.id
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  status: ManuscriptStatus;
  classification: JournalClassification;
  doi?: string;
  file_url?: string; // Added for the final PDF storage
  issue_assignment?: string; // Added for assigning to Vol/Issue
  created_at: string; // Replaced submittedDate to match Supabase
  published_at?: string; // Added for tracking publication date

  // Kept as an optional nested object because when you query Supabase with joins 
  // (e.g., supabase.from('manuscripts').select('*, metrics:article_metrics(*)')), 
  // it returns the data in this nested format.
  metrics?: ManuscriptMetrics;
}

// Kept for UI logic, very useful for the Editor Dashboard
export interface ReadinessStatus {
  metadataComplete: boolean;
  filesReady: boolean;
  doiAssigned: boolean;
  isReady: boolean;
}