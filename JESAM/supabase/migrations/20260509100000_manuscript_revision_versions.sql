-- Relational revision versions: one row per author upload (proposal §2.5 — revised file + response letter, traceable versions).

CREATE TABLE IF NOT EXISTS public.manuscript_revision_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id uuid NOT NULL REFERENCES public.manuscripts(id) ON DELETE CASCADE,
  revision_number integer NOT NULL,
  file_url text NOT NULL,
  author_note text NOT NULL DEFAULT '',
  response_letter text,
  submitter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT manuscript_revision_versions_manuscript_number_key UNIQUE (manuscript_id, revision_number),
  CONSTRAINT manuscript_revision_versions_number_positive CHECK (revision_number >= 1)
);

CREATE INDEX IF NOT EXISTS manuscript_revision_versions_manuscript_id_idx
  ON public.manuscript_revision_versions (manuscript_id);

COMMENT ON TABLE public.manuscript_revision_versions IS
  'Each row is one author revision upload (revised manuscript file + notes); aligns with CMSC 191 §2.5 version control.';

-- Editorial extension grants (not counted as revision uploads)
CREATE TABLE IF NOT EXISTS public.revision_extension_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id uuid NOT NULL REFERENCES public.manuscripts(id) ON DELETE CASCADE,
  reason text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS revision_extension_grants_manuscript_id_idx
  ON public.revision_extension_grants (manuscript_id);

ALTER TABLE public.manuscript_revision_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_extension_grants ENABLE ROW LEVEL SECURITY;

-- Reuse staff helper from peer_review migration (must exist)
CREATE POLICY "manuscript_revision_versions_staff_all"
  ON public.manuscript_revision_versions
  FOR ALL
  TO authenticated
  USING (public.peer_review_is_staff())
  WITH CHECK (public.peer_review_is_staff());

CREATE POLICY "manuscript_revision_versions_author_select"
  ON public.manuscript_revision_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.manuscripts m
      WHERE m.id = manuscript_revision_versions.manuscript_id
        AND m.submitter_id = auth.uid()
    )
  );

CREATE POLICY "manuscript_revision_versions_author_insert"
  ON public.manuscript_revision_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.manuscripts m
      WHERE m.id = manuscript_revision_versions.manuscript_id
        AND m.submitter_id = auth.uid()
    )
  );

CREATE POLICY "revision_extension_grants_staff_insert"
  ON public.revision_extension_grants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.peer_review_is_staff());

CREATE POLICY "revision_extension_grants_select"
  ON public.revision_extension_grants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.manuscripts m
      WHERE m.id = revision_extension_grants.manuscript_id
        AND m.submitter_id = auth.uid()
    )
    OR public.peer_review_is_staff()
  );
