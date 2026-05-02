-- Ensure all signed-in roles can discover published journals on /browse.
-- Existing author/staff policies remain intact; this additive SELECT policy only
-- broadens visibility for rows that are already publicly published.

DROP POLICY IF EXISTS "manuscripts_select_published_authenticated" ON public.manuscripts;

CREATE POLICY "manuscripts_select_published_authenticated"
  ON public.manuscripts
  FOR SELECT
  TO authenticated
  USING (status = 'Published');

COMMENT ON POLICY "manuscripts_select_published_authenticated" ON public.manuscripts IS
  'Allows any authenticated user role to read published manuscripts for journals dashboard parity.';
