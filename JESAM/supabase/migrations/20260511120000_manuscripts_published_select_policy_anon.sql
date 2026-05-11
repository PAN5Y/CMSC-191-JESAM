-- Ensure that anon (public guests) can discover published journals on the landing page.
-- This adds to the existing authenticated policy by granting access to the anon role.

DROP POLICY IF EXISTS "manuscripts_select_published_anon" ON public.manuscripts;

CREATE POLICY "manuscripts_select_published_anon"
  ON public.manuscripts
  FOR SELECT
  TO anon
  USING (status = 'Published');

COMMENT ON POLICY "manuscripts_select_published_anon" ON public.manuscripts IS
  'Allows public guests (anon role) to read published manuscripts for the journals dashboard.';
