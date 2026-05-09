-- Ensure Technical Editors can see and operate on manuscripts that reached peer review.
-- This is additive so it works even when older "staff read all manuscripts" policies
-- still omit the technical_editor role.

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
        'managing_editor',
        'technical_editor',
        'production_editor',
        'editor_in_chief',
        'system_admin'
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.peer_review_is_staff() TO authenticated;

DROP POLICY IF EXISTS "manuscripts_technical_editor_select_peer_review" ON public.manuscripts;
CREATE POLICY "manuscripts_technical_editor_select_peer_review"
  ON public.manuscripts
  FOR SELECT
  TO authenticated
  USING (
    status IN ('Peer Review', 'Revision Requested')
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('technical_editor', 'system_admin')
    )
  );

DROP POLICY IF EXISTS "manuscripts_technical_editor_update_peer_review" ON public.manuscripts;
CREATE POLICY "manuscripts_technical_editor_update_peer_review"
  ON public.manuscripts
  FOR UPDATE
  TO authenticated
  USING (
    status IN ('Peer Review', 'Revision Requested')
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('technical_editor', 'system_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('technical_editor', 'system_admin')
    )
  );

COMMENT ON POLICY "manuscripts_technical_editor_select_peer_review" ON public.manuscripts IS
  'Allows technical editors to see manuscripts currently in peer-review operations.';

COMMENT ON POLICY "manuscripts_technical_editor_update_peer_review" ON public.manuscripts IS
  'Allows technical editors to update peer-review manuscripts as they invite reviewers and record decisions.';
