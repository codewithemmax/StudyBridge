-- StudyBridge Step 3 schema for Supabase/PostgreSQL.
-- Run this in the Supabase SQL editor for the prototype database.

create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  whatsapp_phone text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.syllabus_topics (
  id text primary key,
  subject text not null,
  unit text not null,
  topic text not null,
  exam_scaffold text not null default 'WAEC/JAMB',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tutoring_sessions (
  id text primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  topic_id text not null references public.syllabus_topics(id),
  problem_summary text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  difficulty text not null default 'unknown' check (difficulty in ('unknown', 'easy', 'medium', 'hard')),
  stage text not null,
  nudge_count integer not null default 0,
  student_attempt_count integer not null default 0,
  direct_answer_request_count integer not null default 0,
  answer_leak_block_count integer not null default 0,
  outcome text not null default 'in_progress' check (outcome in ('in_progress', 'understood', 'needs_review', 'gave_answer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tutoring_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.tutoring_sessions(id) on delete cascade,
  role text not null check (role in ('student', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.topic_struggles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  topic_id text not null references public.syllabus_topics(id),
  session_id text references public.tutoring_sessions(id) on delete set null,
  difficulty text not null default 'unknown' check (difficulty in ('unknown', 'easy', 'medium', 'hard')),
  nudge_count integer not null default 0,
  answer_leak_block_count integer not null default 0,
  outcome text not null default 'in_progress' check (outcome in ('in_progress', 'understood', 'needs_review', 'gave_answer')),
  created_at timestamptz not null default now()
);

create index if not exists idx_tutoring_sessions_student_updated on public.tutoring_sessions(student_id, updated_at desc);
create index if not exists idx_tutoring_messages_session_created on public.tutoring_messages(session_id, created_at);
create index if not exists idx_topic_struggles_student_topic on public.topic_struggles(student_id, topic_id, created_at desc);
