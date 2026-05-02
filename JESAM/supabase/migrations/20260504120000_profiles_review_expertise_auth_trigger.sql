-- Ensures profiles.review_expertise is set from auth raw_user_meta_data when the
-- existing handle_new_user / on_auth_user_created trigger does not map this column.
-- Runs AFTER INSERT on auth.users (name sorts after typical "on_auth_user_created" triggers).

CREATE OR REPLACE FUNCTION public.profiles_sync_review_expertise_from_user_meta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET review_expertise = NULLIF(BTRIM(NEW.raw_user_meta_data->>'review_expertise'), '')
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_review_expertise_on_auth_user ON auth.users;

CREATE TRIGGER profiles_sync_review_expertise_on_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_sync_review_expertise_from_user_meta();
