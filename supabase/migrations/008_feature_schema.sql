-- ============================================================
-- 008: Feature schema additions
-- Adds: tags, public sharing, session results history,
--       image storage bucket, and supporting RLS/grants.
-- ============================================================

-- --------------------------------------------------------
-- 1. games — tags and public sharing
-- --------------------------------------------------------

alter table public.games
  add column if not exists tags        text[]           not null default '{}',
  add column if not exists is_public   boolean          not null default false,
  add column if not exists cover_image text;            -- optional URL / Storage path

-- Index so we can quickly filter by tag (uses GIN for array operators)
create index if not exists idx_games_tags on public.games using gin(tags);

-- Index for public games listing
create index if not exists idx_games_public on public.games(is_public) where is_public = true;

-- Any authenticated user can read a publicly shared game
drop policy if exists "anyone_read_public_games" on public.games;
create policy "anyone_read_public_games"
  on public.games for select to authenticated, anon
  using (is_public = true);

-- --------------------------------------------------------
-- 2. sessions — result summary snapshot
-- --------------------------------------------------------

alter table public.sessions
  add column if not exists summary jsonb;
-- Stores the final leaderboard as JSON so history is instant,
-- even after session_players are cleaned up.
-- Shape: [{ rank, display_name, total_points, player_id }]

-- --------------------------------------------------------
-- 3. session_results — per-player history table
-- --------------------------------------------------------
-- One row per player per session, written when the session ends.
-- Denormalized on purpose: readable even if player account is gone.

create table if not exists public.session_results (
  id              uuid        primary key default gen_random_uuid(),
  session_id      uuid        not null references public.sessions(id) on delete cascade,
  player_id       uuid        references public.session_players(id) on delete set null,
  display_name    text        not null,
  total_points    int         not null default 0,
  correct_count   int         not null default 0,
  question_count  int         not null default 0,
  rank            int         not null default 0,
  created_at      timestamptz not null default now(),
  unique (session_id, display_name)
);

create index if not exists idx_session_results_session on public.session_results(session_id);
create index if not exists idx_session_results_player  on public.session_results(player_id);

alter table public.session_results enable row level security;

-- Host can read all results for their own sessions
create policy "hosts_read_own_session_results"
  on public.session_results for select to authenticated
  using (
    session_id in (
      select id from public.sessions where host_user_id = auth.uid()
    )
  );

-- Host can insert/update results for their own sessions
create policy "hosts_write_own_session_results"
  on public.session_results for all to authenticated
  using (
    session_id in (
      select id from public.sessions where host_user_id = auth.uid()
    )
  )
  with check (
    session_id in (
      select id from public.sessions where host_user_id = auth.uid()
    )
  );

-- Players can read results for sessions they participated in
create policy "players_read_session_results"
  on public.session_results for select to authenticated, anon
  using (session_id in (select public.my_session_ids()));

-- --------------------------------------------------------
-- 4. game_tags — normalised tag lookup (optional, future use)
-- --------------------------------------------------------
-- Kept as a simple text[] for now. Add this table later if you
-- need autocomplete or enforced tag vocabulary.

-- --------------------------------------------------------
-- 5. Grants for new tables
-- --------------------------------------------------------

grant select, insert, update, delete on table public.session_results to authenticated;
grant select                          on table public.session_results to anon;
grant usage, select on all sequences in schema public to authenticated, anon;

-- --------------------------------------------------------
-- 6. RPC: finalize_session
-- Writes session_results rows and marks session as completed.
-- Called by the host when they click "End session".
-- --------------------------------------------------------

create or replace function public.finalize_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_check uuid;
begin
  -- Verify caller owns this session
  select host_user_id into v_host_check
  from public.sessions
  where id = p_session_id;

  if v_host_check is null then
    raise exception 'Session not found';
  end if;

  if v_host_check <> auth.uid() then
    raise exception 'Permission denied';
  end if;

  -- Compute per-player totals and upsert into session_results
  insert into public.session_results (
    session_id, player_id, display_name,
    total_points, correct_count, question_count, rank
  )
  select
    a.session_id,
    sp.id                         as player_id,
    sp.display_name,
    coalesce(sum(a.awarded_points), 0)  as total_points,
    coalesce(sum(case when a.is_correct then 1 else 0 end), 0) as correct_count,
    count(distinct a.question_id) as question_count,
    rank() over (
      order by coalesce(sum(a.awarded_points), 0) desc
    )                             as rank
  from public.session_players sp
  left join public.answers a
    on a.player_id = sp.id and a.session_id = p_session_id
  where sp.session_id = p_session_id
  group by a.session_id, sp.id, sp.display_name
  on conflict (session_id, display_name)
  do update set
    total_points   = excluded.total_points,
    correct_count  = excluded.correct_count,
    question_count = excluded.question_count,
    rank           = excluded.rank;

  -- Save summary snapshot on sessions row
  update public.sessions
  set
    state      = 'completed',
    ended_at   = now(),
    allow_join = false,
    summary    = (
      select jsonb_agg(
        jsonb_build_object(
          'rank',         sr.rank,
          'display_name', sr.display_name,
          'total_points', sr.total_points,
          'correct_count',sr.correct_count
        ) order by sr.rank
      )
      from public.session_results sr
      where sr.session_id = p_session_id
    )
  where id = p_session_id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.finalize_session(uuid) to authenticated;

-- --------------------------------------------------------
-- 7. Supabase Storage — question-images bucket
-- --------------------------------------------------------
-- Run this block to create the storage bucket.
-- If you use the Supabase dashboard instead, skip this.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-images',
  'question-images',
  true,                        -- public: images served via CDN without auth
  5242880,                     -- 5 MB per file
  array['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: authenticated hosts can upload
drop policy if exists "hosts_upload_question_images" on storage.objects;
create policy "hosts_upload_question_images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'question-images'
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  );

-- Storage RLS: file owner can update / delete their own uploads
drop policy if exists "hosts_manage_own_question_images" on storage.objects;
create policy "hosts_manage_own_question_images"
  on storage.objects for update, delete to authenticated
  using (
    bucket_id = 'question-images'
    and owner = auth.uid()
  );

-- Storage RLS: public read (bucket is public so CDN handles it, but policy belt-and-suspenders)
drop policy if exists "public_read_question_images" on storage.objects;
create policy "public_read_question_images"
  on storage.objects for select to authenticated, anon
  using (bucket_id = 'question-images');

-- --------------------------------------------------------
-- 8. Reload PostgREST schema cache
-- --------------------------------------------------------

notify pgrst, 'reload schema';
