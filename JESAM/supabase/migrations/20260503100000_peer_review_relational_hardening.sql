-- Relational peer review: constraints, active round on manuscripts, align defaults with app (3 reviewers).
-- Tables are created by 20260503090000_peer_review_tables_bootstrap.sql when missing; statements below are idempotent.

ALTER TABLE public.manuscripts
  ADD COLUMN IF NOT EXISTS peer_review_active_round integer;

COMMENT ON COLUMN public.manuscripts.peer_review_active_round IS
  'Current peer-review round number; mirrors former submission_metadata.peer_review.activeRound.';

-- Align default with PEER_REVIEW_TARGET_COUNT = 3 in application.
ALTER TABLE public.peer_review_rounds
  ALTER COLUMN target_reviewer_count SET DEFAULT 3;

-- One row per manuscript per round.
CREATE UNIQUE INDEX IF NOT EXISTS peer_review_rounds_manuscript_round_key
  ON public.peer_review_rounds (manuscript_id, round_number);

-- RLS stubs (enable when policies mirror manuscripts — editorial CRUD, reviewer SELECT by email):
-- ALTER TABLE public.peer_review_rounds ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reviewer_invitations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.review_submissions ENABLE ROW LEVEL SECURITY;
-- Then CREATE POLICY ... for roles consistent with public.manuscripts.
