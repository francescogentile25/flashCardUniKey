create extension if not exists pgcrypto;

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  known_count integer not null default 0,
  unknown_count integer not null default 0,
  last_seen_at timestamptz,
  next_review_at timestamptz not null default now(),
  mastery_level text not null default 'new' check (
    mastery_level in ('new', 'weak', 'review', 'almost', 'mastered')
  ),
  created_at timestamptz not null default now()
);

-- Migrazione: rimuove il dominio "colloquio programmazione" (area/level).
-- Le domande di medicina hanno solo domanda + risposta.
alter table public.flashcards drop column if exists area;
alter table public.flashcards drop column if exists level;

alter table public.flashcards
  add column if not exists known_count integer not null default 0,
  add column if not exists unknown_count integer not null default 0,
  add column if not exists last_seen_at timestamptz,
  add column if not exists next_review_at timestamptz not null default now(),
  add column if not exists mastery_level text not null default 'new';

-- Materia di appartenenza: senza, un deck da centinaia di card e un mucchio unico.
alter table public.flashcards
  add column if not exists subject text not null default 'Generale';

-- Provenienza: da quale PDF viene la card e con quale paragrafo di contesto.
alter table public.flashcards
  add column if not exists source_file text,
  add column if not exists source_excerpt text;

-- Stato SM-2. interval_days e in giorni frazionari (le card sbagliate tornano in minuti).
alter table public.flashcards
  add column if not exists ease_factor real not null default 2.5,
  add column if not exists interval_days real not null default 0,
  add column if not exists repetitions integer not null default 0;

create index if not exists flashcards_subject_idx on public.flashcards (subject);
create index if not exists flashcards_next_review_idx on public.flashcards (next_review_at);

alter table public.flashcards enable row level security;

drop policy if exists flashcards_select_public on public.flashcards;
create policy flashcards_select_public
  on public.flashcards
  for select
  to anon, authenticated
  using (true);

drop policy if exists flashcards_insert_public on public.flashcards;
create policy flashcards_insert_public
  on public.flashcards
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists flashcards_update_public on public.flashcards;
create policy flashcards_update_public
  on public.flashcards
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists flashcards_delete_public on public.flashcards;
create policy flashcards_delete_public
  on public.flashcards
  for delete
  to anon, authenticated
  using (true);

-- Storico dei ripassi: una riga per swipe. Append-only, alimenta streak,
-- grafico giornaliero e classifica delle domande piu sbagliate.
create table if not exists public.review_log (
  id uuid primary key default gen_random_uuid(),
  flashcard_id uuid not null references public.flashcards (id) on delete cascade,
  outcome text not null check (outcome in ('known', 'unknown')),
  subject text not null default 'Generale',
  source text not null default 'deck' check (source in ('deck', 'quiz')),
  reviewed_at timestamptz not null default now()
);

create index if not exists review_log_reviewed_at_idx on public.review_log (reviewed_at desc);
create index if not exists review_log_flashcard_idx on public.review_log (flashcard_id);

alter table public.review_log enable row level security;

drop policy if exists review_log_select_public on public.review_log;
create policy review_log_select_public
  on public.review_log
  for select
  to anon, authenticated
  using (true);

drop policy if exists review_log_insert_public on public.review_log;
create policy review_log_insert_public
  on public.review_log
  for insert
  to anon, authenticated
  with check (true);

insert into public.flashcards (question, answer)
values
  (
    'Quali sono i quattro foglietti della parete del cuore dall''interno all''esterno?',
    'Endocardio (riveste le cavita), miocardio (muscolo cardiaco), epicardio (pericardio viscerale) e pericardio parietale con la cavita pericardica interposta.'
  ),
  (
    'Che cosa misura la clearance della creatinina?',
    'Stima il filtrato glomerulare (GFR): il volume di plasma depurato dalla creatinina nell''unita di tempo. La creatinina viene filtrata e quasi non riassorbita, quindi approssima bene il GFR.'
  ),
  (
    'Qual e il meccanismo d''azione delle penicilline?',
    'Inibiscono la transpeptidasi (PBP) bloccando la sintesi del peptidoglicano della parete batterica; sono battericide sui batteri in fase di crescita attiva.'
  )
on conflict do nothing;
