-- Run this once in your Supabase project's SQL editor (Database -> SQL Editor).
-- Stores one row per completed solo game, so avg/best stats can be computed per player.

create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null,
  metric_value numeric not null,
  played_at timestamptz not null default now()
);

-- Aim Trainer logs accuracy as metric_value and avg hit time separately here (nullable — every
-- other game leaves this null). Run this against an existing project to pick up the column.
alter table public.game_results add column if not exists avg_hit_ms numeric;

create index if not exists game_results_user_game_idx on public.game_results (user_id, game_id);

alter table public.game_results enable row level security;

create policy "Users can insert their own results"
  on public.game_results for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own results"
  on public.game_results for select
  using (auth.uid() = user_id);
