-- Two (2) submitted reviews gate an editorial decision; a third reviewer is optional (e.g. accept vs reject split).

ALTER TABLE public.peer_review_rounds
  ALTER COLUMN target_reviewer_count SET DEFAULT 2;

UPDATE public.peer_review_rounds
SET target_reviewer_count = 2
WHERE target_reviewer_count = 3;
