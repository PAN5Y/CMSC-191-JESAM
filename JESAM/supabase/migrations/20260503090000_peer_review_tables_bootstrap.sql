-- Bootstrap peer review tables for projects where older migrations were never applied to Supabase.
-- Prerequisites: public.manuscripts(id uuid) must exist.
-- Safe if tables already exist (IF NOT EXISTS). Run via Supabase SQL Editor or: supabase db push

CREATE TABLE IF NOT EXISTS public.peer_review_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id uuid NOT NULL REFERENCES public.manuscripts(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  target_reviewer_count integer NOT NULL DEFAULT 3,
  editor_decision text,
  editor_decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.reviewer_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peer_review_round_id uuid NOT NULL REFERENCES public.peer_review_rounds(id) ON DELETE CASCADE,
  reviewer_email text NOT NULL,
  reviewer_name text,
  expertise text,
  status text NOT NULL DEFAULT 'invited',
  invited_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.review_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES public.reviewer_invitations(id) ON DELETE CASCADE,
  recommendation text NOT NULL,
  summary text NOT NULL,
  major_concerns text NOT NULL,
  minor_concerns text NOT NULL,
  confidential_to_editor text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manuscripts
  ADD COLUMN IF NOT EXISTS peer_review_active_round integer;

COMMENT ON COLUMN public.manuscripts.peer_review_active_round IS
  'Current peer-review round number; mirrors former submission_metadata.peer_review.activeRound.';

-- Align default with PEER_REVIEW_TARGET_COUNT = 3 (also fixes tables created with default 2).
ALTER TABLE public.peer_review_rounds
  ALTER COLUMN target_reviewer_count SET DEFAULT 3;

CREATE UNIQUE INDEX IF NOT EXISTS peer_review_rounds_manuscript_round_key
  ON public.peer_review_rounds (manuscript_id, round_number);

-- Optional RLS (mirror manuscripts when ready):
-- ALTER TABLE public.peer_review_rounds ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reviewer_invitations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.review_submissions ENABLE ROW LEVEL SECURITY;
