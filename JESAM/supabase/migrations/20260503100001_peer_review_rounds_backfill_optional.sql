-- Optional: seed peer_review_rounds from legacy submission_metadata.peer_review.rounds JSON.
-- Does not migrate invitations or reviews (nested); run an app-level job or extend SQL for full parity.
-- Safe to run multiple times: skips duplicates via UNIQUE (manuscript_id, round_number).

INSERT INTO public.peer_review_rounds (
  manuscript_id,
  round_number,
  target_reviewer_count,
  editor_decision,
  editor_decision_note,
  created_at,
  decided_at
)
SELECT DISTINCT ON (m.id, (elem->>'round')::integer)
  m.id,
  (elem->>'round')::integer,
  COALESCE((elem->>'targetReviewerCount')::integer, 3),
  NULLIF(elem->>'editorDecision', ''),
  NULLIF(elem->>'editorDecisionNote', ''),
  COALESCE((elem->>'createdAt')::timestamptz, now()),
  CASE
    WHEN elem->>'decidedAt' IS NOT NULL AND elem->>'decidedAt' <> ''
    THEN (elem->>'decidedAt')::timestamptz
    ELSE NULL
  END
FROM public.manuscripts m,
  LATERAL jsonb_array_elements(
    COALESCE(m.submission_metadata->'peer_review'->'rounds', '[]'::jsonb)
  ) AS elem
WHERE (elem->>'round') IS NOT NULL
  AND (elem->>'round') ~ '^[0-9]+$'
ON CONFLICT (manuscript_id, round_number) DO NOTHING;
