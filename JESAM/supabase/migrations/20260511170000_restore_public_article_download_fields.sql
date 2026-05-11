drop view if exists public.public_journal_article_details;

create view public.public_journal_article_details as
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
    keywords,
    nullif(btrim(file_url), '') as normalized_file_url,
    substring(
      nullif(btrim(file_url), '')
      from '/storage/v1/object/public/manuscript-files/(.+)$'
    ) as storage_object_name
  from public.manuscripts
  where status = 'Published'
    and published_at is not null
)
select
  published_manuscripts.journal_id,
  published_manuscripts.journal_title,
  published_manuscripts.id,
  published_manuscripts.title,
  published_manuscripts.authors,
  published_manuscripts.abstract,
  published_manuscripts.summary,
  published_manuscripts.classification,
  published_manuscripts.published_at,
  published_manuscripts.issue_assignment,
  published_manuscripts.doi,
  published_manuscripts.keywords,
  case
    when published_manuscripts.normalized_file_url is null then 'unavailable'
    when published_manuscripts.storage_object_name is null then 'unknown'
    when storage_file.name is null then 'temporary-failure'
    else 'available'
  end as download_availability_status,
  case
    when storage_file.name is not null then true
    when published_manuscripts.normalized_file_url is null then false
    else false
  end as is_downloadable,
  case
    when storage_file.name is not null
      then published_manuscripts.normalized_file_url
    else null
  end as download_url
from published_manuscripts
left join storage.objects as storage_file
  on storage_file.bucket_id = 'manuscript-files'
 and storage_file.name = published_manuscripts.storage_object_name;

grant select on public.public_journal_article_details to anon, authenticated;
