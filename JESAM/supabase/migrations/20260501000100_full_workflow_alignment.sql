-- Full-system transcript-first workflow alignment
-- Adds dedicated lifecycle entities for peer review, revision, notifications, and audit.

create table if not exists public.peer_review_rounds (
  id uuid primary key default gen_random_uuid(),
  manuscript_id uuid not null references public.manuscripts(id) on delete cascade,
  round_number integer not null,
  target_reviewer_count integer not null default 2,
  editor_decision text,
  editor_decision_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.reviewer_invitations (
  id uuid primary key default gen_random_uuid(),
  peer_review_round_id uuid not null references public.peer_review_rounds(id) on delete cascade,
  reviewer_email text not null,
  reviewer_name text,
  expertise text,
  status text not null default 'invited',
  invited_at timestamptz not null default now(),
  due_at timestamptz
);

create table if not exists public.review_submissions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.reviewer_invitations(id) on delete cascade,
  recommendation text not null,
  summary text not null,
  major_concerns text not null,
  minor_concerns text not null,
  confidential_to_editor text,
  submitted_at timestamptz not null default now()
);

create table if not exists public.revision_versions (
  id uuid primary key default gen_random_uuid(),
  manuscript_id uuid not null references public.manuscripts(id) on delete cascade,
  round_number integer not null,
  author_note text not null,
  response_letter text,
  file_url text,
  extension_granted boolean not null default false,
  extension_reason text,
  submitted_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  manuscript_id uuid not null references public.manuscripts(id) on delete cascade,
  event_type text not null,
  recipient_role text not null,
  recipient_email text,
  message text not null,
  delivered boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_audit_logs (
  id uuid primary key default gen_random_uuid(),
  manuscript_id uuid not null references public.manuscripts(id) on delete cascade,
  actor text not null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);
