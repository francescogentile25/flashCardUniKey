create extension if not exists pgcrypto;

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  area text not null check (area in ('frontend', 'backend')),
  level text not null check (level in ('junior', 'middle')),
  known_count integer not null default 0,
  unknown_count integer not null default 0,
  last_seen_at timestamptz,
  next_review_at timestamptz not null default now(),
  mastery_level text not null default 'new' check (
    mastery_level in ('new', 'weak', 'review', 'almost', 'mastered')
  ),
  created_at timestamptz not null default now()
);

alter table public.flashcards
  add column if not exists known_count integer not null default 0,
  add column if not exists unknown_count integer not null default 0,
  add column if not exists last_seen_at timestamptz,
  add column if not exists next_review_at timestamptz not null default now(),
  add column if not exists mastery_level text not null default 'new';

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

insert into public.flashcards (question, answer, area, level)
values
  (
    'Qual e la differenza tra let, const e var in JavaScript?',
    'var ha function scope ed e soggetta a hoisting piu permissivo. let e const hanno block scope; const impedisce la riassegnazione del binding, ma non rende immutabile un oggetto.',
    'frontend',
    'junior'
  ),
  (
    'Quando useresti un indice su una tabella SQL?',
    'Un indice velocizza filtri, join e ordinamenti su colonne lette spesso. Va bilanciato perche occupa spazio e rallenta scritture come insert, update e delete.',
    'backend',
    'junior'
  ),
  (
    'Come funziona la change detection OnPush in Angular?',
    'OnPush riduce i controlli del componente: aggiorna la vista quando cambiano input per riferimento, partono eventi nel componente, observable usati con async pipe emettono, oppure un signal letto dal template cambia.',
    'frontend',
    'middle'
  )
on conflict do nothing;
