-- Add missing question fields for emoji and image_guess types
alter table public.questions
  add column if not exists emoji_prompt text,
  add column if not exists image_reveal_config jsonb,
  add column if not exists slide_layout text not null default 'auto',
  add column if not exists is_demo boolean not null default false;

-- Expand question type constraint to include all app types
alter table public.questions drop constraint if exists questions_type_check;
alter table public.questions
  add constraint questions_type_check
  check (type in ('mcq', 'true_false', 'short_text', 'emoji', 'image_guess', 'section'));

-- Drop unique position constraints so reordering works without conflicts
alter table public.questions drop constraint if exists questions_game_id_position_key;
alter table public.question_options drop constraint if exists question_options_question_id_position_key;

create index if not exists idx_questions_game_position on public.questions(game_id, position);
create index if not exists idx_options_question_position on public.question_options(question_id, position);

-- Add missing session timing and state fields
alter table public.sessions
  add column if not exists current_question_index integer,
  add column if not exists current_question_started_at timestamptz,
  add column if not exists paused_remaining_ms integer,
  add column if not exists image_reveal_level integer not null default 0;

-- Track how many times a player revealed the image (for point penalty)
alter table public.answers
  add column if not exists player_reveal_count integer;

-- Allow anonymous users to act as hosts (auth is enforced at app level via host code)
drop policy if exists "hosts_manage_own_games" on public.games;
create policy "hosts_manage_own_games"
  on public.games for all to authenticated
  using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

drop policy if exists "hosts_manage_own_sessions" on public.sessions;
create policy "hosts_manage_own_sessions"
  on public.sessions for all to authenticated
  using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

-- Allow any authenticated user to read open sessions (needed for room code lookup)
create policy "anyone_read_open_sessions"
  on public.sessions for select to authenticated
  using (allow_join = true);

-- Allow players to read the game metadata for sessions they have joined
create policy "players_read_joined_game"
  on public.games for select to authenticated
  using (
    id in (
      select s.game_id from public.sessions s
      join public.session_players sp on sp.session_id = s.id
      where sp.auth_user_id = auth.uid()
    )
  );

-- Allow players to read questions for sessions they have joined
create policy "players_read_session_questions"
  on public.questions for select to authenticated
  using (
    game_id in (
      select s.game_id from public.sessions s
      join public.session_players sp on sp.session_id = s.id
      where sp.auth_user_id = auth.uid()
    )
  );

-- Allow players to read question options for sessions they have joined
create policy "players_read_session_options"
  on public.question_options for select to authenticated
  using (
    question_id in (
      select q.id from public.questions q
      join public.sessions s on s.game_id = q.game_id
      join public.session_players sp on sp.session_id = s.id
      where sp.auth_user_id = auth.uid()
    )
  );

-- Allow players to see all players in their session (for leaderboard)
create policy "players_read_session_players_list"
  on public.session_players for select to authenticated
  using (
    session_id in (
      select sp.session_id from public.session_players sp
      where sp.auth_user_id = auth.uid()
    )
  );

-- Allow players to read all answers in their session (for leaderboard score)
create policy "players_read_session_answers_all"
  on public.answers for select to authenticated
  using (
    session_id in (
      select sp.session_id from public.session_players sp
      where sp.auth_user_id = auth.uid()
    )
  );
