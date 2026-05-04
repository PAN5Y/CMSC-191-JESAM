-- Optional SESAM focus for reviewer invite ranking (Land, Air, Water, People).
-- Requires public.profiles (created with auth in Supabase). Safe to re-run.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS review_expertise text;

COMMENT ON COLUMN public.profiles.review_expertise IS
  'Optional SESAM focus (Land, Air, Water, People) for peer-review suggestions; null = generic match.';

-- RLS: if profiles already has RLS enabled, editorial staff need SELECT on reviewer rows for the invite picker.
-- Do not ENABLE ROW LEVEL SECURITY here without existing policies (would block reads).
-- Apply manually in SQL Editor when appropriate, e.g. after auditing existing policies:
--
-- DROP POLICY IF EXISTS "profiles_staff_select_reviewer_directory" ON public.profiles;
-- CREATE POLICY "profiles_staff_select_reviewer_directory"
--   ON public.profiles FOR SELECT TO authenticated
--   USING (
--     role = 'reviewer'
--     AND EXISTS (
--       SELECT 1 FROM public.profiles AS staff
--       WHERE staff.id = auth.uid()
--       AND staff.role IN (
--         'associate_editor', 'managing_editor', 'editor_in_chief',
--         'system_admin', 'production_editor'
--       )
--     )
--   );
