create or replace view public.public_journal_listing as
with published_manuscripts as (
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
    case classification
      when 'Land' then 'Public archive slice focused on land systems, agriculture, upland resilience, forestry, and terrestrial environmental management.'
      when 'Air' then 'Public archive slice focused on air quality, urban heat, atmospheric risk, and environmental monitoring in built environments.'
      when 'Water' then 'Public archive slice focused on water systems, watersheds, estuaries, coastal monitoring, and aquatic environmental management.'
      when 'People' then 'Public archive slice focused on communities, environmental policy, governance, and people-centered sustainability research.'
      else 'Public archive of JESAM-published environmental research with journal-level context for readers before they move into article detail.'
    end as journal_description,
    'University of the Philippines Los Banos - School of Environmental Science and Management'::text as institution,
    case classification
      when 'Land' then '0119-1144-L'
      when 'Air' then '0119-1144-A'
      when 'Water' then '0119-1144-W'
      when 'People' then '0119-1144-P'
      else '0119-1144'
    end as issn,
    'Public metadata / downloadable papers vary by article'::text as access_label,
    classification,
    issue_assignment,
    published_at
  from manuscripts
  where status = 'Published'
    and published_at is not null
)
select
  journal_id,
  journal_title,
  journal_description,
  institution,
  issn,
  access_label,
  classification,
  issue_assignment,
  published_at
from published_manuscripts;

grant select on public.public_journal_listing to anon, authenticated;

create or replace view public.public_journal_article_previews as
select
  case classification
    when 'Land' then 'jesam-land'
    when 'Air' then 'jesam-air'
    when 'Water' then 'jesam-water'
    when 'People' then 'jesam-people'
    else 'jesam'
  end as journal_id,
  id,
  title,
  authors,
  abstract,
  classification,
  published_at,
  issue_assignment
from manuscripts
where status = 'Published'
  and published_at is not null;

grant select on public.public_journal_article_previews to anon, authenticated;

create or replace view public.public_journal_article_details as
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
  classification,
  published_at,
  issue_assignment,
  doi,
  keywords
from manuscripts
where status = 'Published'
  and published_at is not null;

grant select on public.public_journal_article_details to anon, authenticated;
