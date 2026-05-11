alter table public.manuscripts
  add column if not exists summary text;

comment on column public.manuscripts.summary is
  'Optional public-facing manuscript summary for discovery views. Nullable to preserve compatibility with existing inserts and legacy rows.';

drop view if exists public.public_journal_article_details;

create view public.public_journal_article_details as
select
  case classification
    when 'Land' then 'jesam-land'
    when 'Air' then 'jesam-air'
    when 'Water' then 'jesam-water'
    when 'People' then 'jesam-people'
    else 'jesam'
  end as journal_id,
  case classification
    when 'Land' then 'JESAM Land Systems Review'
    when 'Air' then 'JESAM Atmospheric and Urban Air Studies'
    when 'Water' then 'JESAM Water and Coastal Research'
    when 'People' then 'JESAM Communities and Environmental Governance'
    else 'Journal of Environmental Science and Management'
  end as journal_title,
  id,
  title,
  authors,
  abstract,
  coalesce(
    nullif(btrim(summary), ''),
    nullif(btrim(submission_metadata->'ai_summary'->>'short'), '')
  ) as summary,
  classification,
  published_at,
  issue_assignment,
  doi,
  keywords
from manuscripts
where status = 'Published'
  and published_at is not null;

grant select on public.public_journal_article_details to anon, authenticated;
