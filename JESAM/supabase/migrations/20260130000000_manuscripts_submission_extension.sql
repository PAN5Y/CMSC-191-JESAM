-- JESAM: submission workflow columns and documentation
-- Apply in Supabase SQL Editor or via Supabase CLI.
-- If `manuscripts.status` is a PostgreSQL ENUM, add new values with:
--   ALTER TYPE your_enum_name ADD VALUE IF NOT EXISTS 'In Submission Queue';
-- (repeat for each status below). If status is TEXT with no CHECK, no enum change is needed.

-- Human-readable manuscript reference (e.g. JESAM-2026-12345) for authors and correspondence
ALTER TABLE public.manuscripts
  ADD COLUMN IF NOT EXISTS reference_code text;

CREATE UNIQUE INDEX IF NOT EXISTS manuscripts_reference_code_key
  ON public.manuscripts (reference_code)
  WHERE reference_code IS NOT NULL;

-- Extra intake fields, automated check snapshots, declarations, screening notes (JSON)
ALTER TABLE public.manuscripts
  ADD COLUMN IF NOT EXISTS submission_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Submission-phase status values (store as text; align with app ManuscriptStatus):
--   In Submission Queue, Administrative Check, Editor In Chief Screening, Peer Review,
--   Returned to Author, Rejected,
--   Accepted, In Production, Published, Return to Revision, Retracted

-- Example RLS (adjust table/column names to match your project):
-- ALTER TABLE public.manuscripts ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Authors read own manuscripts"
--   ON public.manuscripts FOR SELECT
--   USING (auth.uid() = submitter_id);
--
-- CREATE POLICY "Authors insert own manuscripts"
--   ON public.manuscripts FOR INSERT
--   WITH CHECK (auth.uid() = submitter_id);
--
-- CREATE POLICY "Staff read all manuscripts"
--   ON public.manuscripts FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles p
--       WHERE p.id = auth.uid()
--       AND p.role IN ('editor_in_chief','managing_editor','associate_editor','production_editor','system_admin')
--     )
--   );
--
-- CREATE POLICY "Staff update manuscripts"
--   ON public.manuscripts FOR UPDATE
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles p
--       WHERE p.id = auth.uid()
--       AND p.role IN ('editor_in_chief','managing_editor','associate_editor','production_editor','system_admin')
--     )
--   );
