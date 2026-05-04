-- Row Level Security for relational peer review.
-- Uses SECURITY DEFINER helpers to avoid infinite recursion (42P17) between
-- peer_review_rounds and reviewer_invitations policies.

ALTER TABLE public.peer_review_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewer_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "peer_review_rounds_staff_manage" ON public.peer_review_rounds;
DROP POLICY IF EXISTS "peer_review_rounds_select_author_or_invited_reviewer" ON public.peer_review_rounds;

DROP POLICY IF EXISTS "reviewer_invitations_staff_manage" ON public.reviewer_invitations;
DROP POLICY IF EXISTS "reviewer_invitations_select_own_email" ON public.reviewer_invitations;
DROP POLICY IF EXISTS "reviewer_invitations_select_as_manuscript_author" ON public.reviewer_invitations;
DROP POLICY IF EXISTS "reviewer_invitations_update_own_email" ON public.reviewer_invitations;

DROP POLICY IF EXISTS "review_submissions_staff_manage" ON public.review_submissions;
DROP POLICY IF EXISTS "review_submissions_select_via_invitation" ON public.review_submissions;
DROP POLICY IF EXISTS "review_submissions_select_as_manuscript_author" ON public.review_submissions;
DROP POLICY IF EXISTS "review_submissions_insert_own_invitation" ON public.review_submissions;

CREATE OR REPLACE FUNCTION public.peer_review_is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN (
        'editor_in_chief',
        'managing_editor',
        'associate_editor',
        'production_editor',
        'system_admin'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.peer_review_round_row_visible(p_round_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.peer_review_rounds pr
      INNER JOIN public.manuscripts m ON m.id = pr.manuscript_id
      WHERE pr.id = p_round_id
        AND m.submitter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.reviewer_invitations ri
      WHERE ri.peer_review_round_id = p_round_id
        AND lower(trim(ri.reviewer_email)) = lower(trim(COALESCE((SELECT auth.jwt() ->> 'email'), '')))
    );
$$;

CREATE OR REPLACE FUNCTION public.reviewer_invitation_row_visible_to_author(p_round_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.peer_review_rounds pr
    INNER JOIN public.manuscripts m ON m.id = pr.manuscript_id
    WHERE pr.id = p_round_id
      AND m.submitter_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.review_submission_row_visible_to_author(p_invitation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reviewer_invitations ri
    INNER JOIN public.peer_review_rounds pr ON pr.id = ri.peer_review_round_id
    INNER JOIN public.manuscripts m ON m.id = pr.manuscript_id
    WHERE ri.id = p_invitation_id
      AND m.submitter_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.review_submission_invitation_matches_reviewer(p_invitation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reviewer_invitations ri
    WHERE ri.id = p_invitation_id
      AND lower(trim(ri.reviewer_email)) = lower(trim(COALESCE((SELECT auth.jwt() ->> 'email'), '')))
  );
$$;

GRANT EXECUTE ON FUNCTION public.peer_review_is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.peer_review_round_row_visible(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reviewer_invitation_row_visible_to_author(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_submission_row_visible_to_author(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_submission_invitation_matches_reviewer(uuid) TO authenticated;

CREATE POLICY "peer_review_rounds_staff_manage"
  ON public.peer_review_rounds
  FOR ALL
  TO authenticated
  USING (public.peer_review_is_staff())
  WITH CHECK (public.peer_review_is_staff());

CREATE POLICY "peer_review_rounds_select_author_or_invited_reviewer"
  ON public.peer_review_rounds
  FOR SELECT
  TO authenticated
  USING (public.peer_review_round_row_visible(id));

CREATE POLICY "reviewer_invitations_staff_manage"
  ON public.reviewer_invitations
  FOR ALL
  TO authenticated
  USING (public.peer_review_is_staff())
  WITH CHECK (public.peer_review_is_staff());

CREATE POLICY "reviewer_invitations_select_own_email"
  ON public.reviewer_invitations
  FOR SELECT
  TO authenticated
  USING (
    lower(trim(reviewer_email)) = lower(trim(COALESCE((SELECT auth.jwt() ->> 'email'), '')))
  );

CREATE POLICY "reviewer_invitations_select_as_manuscript_author"
  ON public.reviewer_invitations
  FOR SELECT
  TO authenticated
  USING (public.reviewer_invitation_row_visible_to_author(peer_review_round_id));

CREATE POLICY "reviewer_invitations_update_own_email"
  ON public.reviewer_invitations
  FOR UPDATE
  TO authenticated
  USING (
    lower(trim(reviewer_email)) = lower(trim(COALESCE((SELECT auth.jwt() ->> 'email'), '')))
  )
  WITH CHECK (
    lower(trim(reviewer_email)) = lower(trim(COALESCE((SELECT auth.jwt() ->> 'email'), '')))
  );

CREATE POLICY "review_submissions_staff_manage"
  ON public.review_submissions
  FOR ALL
  TO authenticated
  USING (public.peer_review_is_staff())
  WITH CHECK (public.peer_review_is_staff());

CREATE POLICY "review_submissions_select_via_invitation"
  ON public.review_submissions
  FOR SELECT
  TO authenticated
  USING (public.review_submission_invitation_matches_reviewer(invitation_id));

CREATE POLICY "review_submissions_select_as_manuscript_author"
  ON public.review_submissions
  FOR SELECT
  TO authenticated
  USING (public.review_submission_row_visible_to_author(invitation_id));

CREATE POLICY "review_submissions_insert_own_invitation"
  ON public.review_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.review_submission_invitation_matches_reviewer(invitation_id));
