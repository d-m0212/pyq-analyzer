-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- 1. Subjects Table
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  session_id uuid not null -- For anonymous multi-tenancy
);

-- 2. Files Table
create table public.files (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects(id) on delete cascade not null,
  name text not null,
  file_path text not null, -- Supabase Storage path
  file_type text check (file_type in ('pdf', 'image')),
  year int,          -- Metadata
  exam_session text, -- Metadata (e.g., 'Main', 'April')
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  session_id uuid not null
);

-- 3. Questions Table (Source of Truth linked to File)
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects(id) on delete cascade not null,
  file_id uuid references public.files(id) on delete cascade, -- ADDED THIS
  text_content text not null,
  normalized_text text, -- Lowercase, stripped punct for easy matching
  embedding vector(768), 
  has_image boolean default false,
  image_path text, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  session_id uuid not null
);

-- 4. Question Occurrences (Optional now, but good for future)
create table public.question_occurrences (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions(id) on delete cascade not null,
  file_id uuid references public.files(id) on delete cascade not null,
  page_number int,
  confidence_score float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Answers (Versioned)
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions(id) on delete cascade not null,
  content text not null, -- Markdown content
  version int default 1,
  model_used text, -- 'gemini-flash', 'llama-3', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.subjects enable row level security;
alter table public.files enable row level security;
alter table public.questions enable row level security;
alter table public.question_occurrences enable row level security;
alter table public.answers enable row level security;

create policy "Allow public access based on session_id" on public.subjects for all using (true);
create policy "Allow public access based on session_id" on public.files for all using (true);
create policy "Allow public access based on session_id" on public.questions for all using (true);
create policy "Allow public access based on session_id" on public.question_occurrences for all using (true);
create policy "Allow public access based on session_id" on public.answers for all using (true);
