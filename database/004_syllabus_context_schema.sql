-- Versioned syllabus grounding layer for Supabase/PostgreSQL.
-- Keep official documents referenced by URL and store structured, searchable
-- learning context here. Do not treat this table as a permanent copy of a
-- changing exam board document.

create table if not exists public.syllabus_sources (
  id text primary key,
  exam_board text not null check (exam_board in ('WAEC', 'JAMB')),
  title text not null,
  source_url text not null,
  syllabus_year integer,
  retrieved_at timestamptz not null default now(),
  content_hash text,
  is_current boolean not null default true,
  notes text
);

create table if not exists public.syllabus_subjects (
  id text primary key,
  exam_board text not null check (exam_board in ('WAEC', 'JAMB')),
  subject_code text not null,
  subject_name text not null,
  source_id text references public.syllabus_sources(id) on delete set null,
  is_active boolean not null default true,
  unique (exam_board, subject_code)
);

create table if not exists public.syllabus_context (
  id text primary key,
  subject_id text not null references public.syllabus_subjects(id) on delete cascade,
  topic_id text references public.syllabus_topics(id) on delete set null,
  parent_id text references public.syllabus_context(id) on delete cascade,
  title text not null,
  context text not null,
  learning_objectives jsonb not null default '[]'::jsonb,
  keywords text[] not null default '{}'::text[],
  exam_notes text,
  sort_order integer not null default 0,
  source_locator text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_syllabus_context_subject_order
  on public.syllabus_context(subject_id, sort_order);
create index if not exists idx_syllabus_context_topic
  on public.syllabus_context(topic_id);
create index if not exists idx_syllabus_context_keywords
  on public.syllabus_context using gin(keywords);

alter table public.syllabus_context
  add column if not exists search_document tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(context, '') || ' ' || coalesce(exam_notes, ''))
  ) stored;

create index if not exists idx_syllabus_context_search
  on public.syllabus_context using gin(search_document);

create or replace function public.search_syllabus_context(
  query_text text,
  requested_subject_id text default null,
  result_limit integer default 8
)
returns table (
  id text,
  subject_id text,
  topic_id text,
  title text,
  context text,
  learning_objectives jsonb,
  exam_notes text,
  relevance real
)
language sql
stable
as $$
  select
    c.id,
    c.subject_id,
    c.topic_id,
    c.title,
    c.context,
    c.learning_objectives,
    c.exam_notes,
    ts_rank(c.search_document, websearch_to_tsquery('english', query_text)) as relevance
  from public.syllabus_context c
  where (requested_subject_id is null or c.subject_id = requested_subject_id)
    and c.search_document @@ websearch_to_tsquery('english', query_text)
  order by relevance desc, c.sort_order
  limit greatest(1, least(result_limit, 50));
$$;
