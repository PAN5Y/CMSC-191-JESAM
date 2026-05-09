-- Add Technical Editor to staff helpers used by peer-review RLS.
-- Statuses for the pre-review flow are stored as text in manuscripts.status.

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
