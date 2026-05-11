-- Grant technical_editor the same database visibility as other editorial staff.
-- Previously peer_review_is_staff() and the manuscripts staff policies omitted this role,
-- preventing TEs from seeing manuscripts in Editorial Review or Checking status.

-- 1. Update the shared staff-check function used by peer_review_rounds,
--    reviewer_invitations, and review_submissions RLS policies.
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
        'technical_editor',
        'production_editor',
        'system_admin'
      )
  );
$$;

-- 2. Additive manuscripts SELECT policy for technical_editor.
--    Existing author / staff / reviewer policies are untouched.
DROP POLICY IF EXISTS "manuscripts_select_technical_editor" ON public.manuscripts;

CREATE POLICY "manuscripts_select_technical_editor"
  ON public.manuscripts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'technical_editor'
    )
  );

-- 3. Additive manuscripts UPDATE policy for technical_editor
--    (needed to save editorial_review and checking_review metadata).
DROP POLICY IF EXISTS "manuscripts_update_technical_editor" ON public.manuscripts;

CREATE POLICY "manuscripts_update_technical_editor"
  ON public.manuscripts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'technical_editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'technical_editor'
    )
  );
