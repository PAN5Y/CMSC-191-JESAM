-- Align with CMSC 191 §2.4: three (3) submitted reviews gate editorial decision per round.

ALTER TABLE public.peer_review_rounds
  ALTER COLUMN target_reviewer_count SET DEFAULT 3;

UPDATE public.peer_review_rounds
SET target_reviewer_count = 3
WHERE target_reviewer_count < 3;
