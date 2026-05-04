-- Allow invited reviewers to SELECT manuscripts they are reviewing (nested PostgREST embed in reviewer portal).
-- Without this, manuscripts!inner returns no row under RLS and invitations disappear from the UI.

DROP POLICY IF EXISTS "manuscripts_select_as_invited_reviewer" ON public.manuscripts;

DROP FUNCTION IF EXISTS public.manuscript_visible_as_invited_reviewer(uuid);

CREATE OR REPLACE FUNCTION public.manuscript_visible_as_invited_reviewer(p_manuscript_id uuid)
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
    WHERE pr.manuscript_id = p_manuscript_id
      AND lower(trim(ri.reviewer_email)) = lower(trim(COALESCE((SELECT auth.jwt() ->> 'email'), '')))
  );
$$;

GRANT EXECUTE ON FUNCTION public.manuscript_visible_as_invited_reviewer(uuid) TO authenticated;

CREATE POLICY "manuscripts_select_as_invited_reviewer"
  ON public.manuscripts
  FOR SELECT
  TO authenticated
  USING (public.manuscript_visible_as_invited_reviewer(id));

COMMENT ON FUNCTION public.manuscript_visible_as_invited_reviewer(uuid) IS
  'RLS helper: true when JWT email matches an invitation for this manuscript (reviewer portal embed).';
