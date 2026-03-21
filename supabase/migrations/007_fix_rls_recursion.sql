-- Fix infinite recursion in session_players and sessions RLS policies.
--
-- Root cause 1: players_read_session_players_list on session_players subqueries
--   session_players itself → PostgreSQL detects infinite recursion → 42P17 error.
-- Root cause 2: players_read_joined_session on sessions subqueries session_players,
--   whose policies subquery sessions back → mutual recursion.
-- Root cause 3: players_read_joined_game on games joins sessions × session_players,
--   triggering the same chains.
--
-- All three share the same fix: a SECURITY DEFINER helper that reads
-- session_players without going through RLS, breaking every recursive chain.

create or replace function public.my_session_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select session_id from session_players where auth_user_id = auth.uid()
$$;

grant execute on function public.my_session_ids() to authenticated;
grant execute on function public.my_session_ids() to anon;

-- Fix 1: session_players self-reference
drop policy if exists "players_read_session_players_list" on public.session_players;
create policy "players_read_session_players_list"
  on public.session_players for select to authenticated, anon
  using (session_id in (select public.my_session_ids()));

-- Fix 2: sessions → session_players cross-reference
drop policy if exists "players_read_joined_session" on public.sessions;
create policy "players_read_joined_session"
  on public.sessions for select to authenticated, anon
  using (id in (select public.my_session_ids()));

-- Fix 3: games → sessions × session_players cross-reference
drop policy if exists "players_read_joined_game" on public.games;
create policy "players_read_joined_game"
  on public.games for select to authenticated, anon
  using (
    id in (
      select game_id from public.sessions
      where id in (select public.my_session_ids())
    )
  );

notify pgrst, 'reload schema';
