create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'host' check (role in ('host')),
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  position int not null,
  type text not null check (type in ('mcq', 'true_false', 'short_text', 'section')),
  prompt text not null,
  image_url text,
  accepted_answer text,
  time_limit_seconds int not null default 30,
  points int not null default 10,
  is_tie_breaker boolean not null default false,
  created_at timestamptz not null default now(),
  unique (game_id, position)
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null,
  label text not null,
  image_url text,
  is_correct boolean not null default false,
  unique (question_id, position)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  room_code text not null unique,
  state text not null default 'lobby' check (state in ('lobby', 'live', 'paused', 'completed')),
  current_question_id uuid references public.questions(id) on delete set null,
  reveal_answers boolean not null default false,
  leaderboard_visible boolean not null default false,
  allow_join boolean not null default true,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.session_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),
  is_active boolean not null default true,
  is_disqualified boolean not null default false,
  unique (session_id, auth_user_id)
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  player_id uuid not null references public.session_players(id) on delete cascade,
  selected_option_id uuid references public.question_options(id) on delete set null,
  text_answer text,
  submitted_at timestamptz not null default now(),
  is_correct boolean,
  awarded_points int not null default 0,
  scored_by uuid references auth.users(id) on delete set null,
  scored_manually boolean not null default false,
  unique (session_id, question_id, player_id)
);

create index idx_games_host on public.games(host_user_id);
create index idx_questions_game on public.questions(game_id);
create index idx_sessions_game on public.sessions(game_id);
create index idx_players_session on public.session_players(session_id);
create index idx_answers_session_question on public.answers(session_id, question_id);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.sessions enable row level security;
alter table public.session_players enable row level security;
alter table public.answers enable row level security;

create policy "hosts_manage_own_profile"
on public.profiles
for all
to authenticated
using (
  id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
)
with check (
  id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

create policy "hosts_manage_own_games"
on public.games
for all
to authenticated
using (
  host_user_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
)
with check (
  host_user_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

create policy "hosts_manage_questions_for_own_games"
on public.questions
for all
to authenticated
using (
  exists (
    select 1
    from public.games g
    where g.id = questions.game_id
      and g.host_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.games g
    where g.id = questions.game_id
      and g.host_user_id = auth.uid()
  )
);

create policy "hosts_manage_options_for_own_questions"
on public.question_options
for all
to authenticated
using (
  exists (
    select 1
    from public.questions q
    join public.games g on g.id = q.game_id
    where q.id = question_options.question_id
      and g.host_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.questions q
    join public.games g on g.id = q.game_id
    where q.id = question_options.question_id
      and g.host_user_id = auth.uid()
  )
);

create policy "hosts_manage_own_sessions"
on public.sessions
for all
to authenticated
using (
  host_user_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
)
with check (
  host_user_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

create policy "players_read_joined_session"
on public.sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.session_players sp
    where sp.session_id = sessions.id
      and sp.auth_user_id = auth.uid()
  )
);

create policy "hosts_read_players_in_own_sessions"
on public.session_players
for select
to authenticated
using (
  exists (
    select 1
    from public.sessions s
    where s.id = session_players.session_id
      and s.host_user_id = auth.uid()
  )
);

create policy "players_read_own_membership"
on public.session_players
for select
to authenticated
using (auth_user_id = auth.uid());

create policy "hosts_manage_players_in_own_sessions"
on public.session_players
for all
to authenticated
using (
  exists (
    select 1
    from public.sessions s
    where s.id = session_players.session_id
      and s.host_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.sessions s
    where s.id = session_players.session_id
      and s.host_user_id = auth.uid()
  )
);

create policy "hosts_read_answers_in_own_sessions"
on public.answers
for select
to authenticated
using (
  exists (
    select 1
    from public.sessions s
    where s.id = answers.session_id
      and s.host_user_id = auth.uid()
  )
);

create policy "players_read_own_answers"
on public.answers
for select
to authenticated
using (
  exists (
    select 1
    from public.session_players sp
    where sp.id = answers.player_id
      and sp.auth_user_id = auth.uid()
  )
);

create policy "players_submit_own_answers"
on public.answers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.session_players sp
    join public.sessions s on s.id = sp.session_id
    where sp.id = answers.player_id
      and sp.auth_user_id = auth.uid()
      and s.id = answers.session_id
      and s.state = 'live'
  )
);

create policy "hosts_score_answers_in_own_sessions"
on public.answers
for update
to authenticated
using (
  exists (
    select 1
    from public.sessions s
    where s.id = answers.session_id
      and s.host_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.sessions s
    where s.id = answers.session_id
      and s.host_user_id = auth.uid()
  )
);

create or replace function public.join_session(p_room_code text, p_display_name text)
returns table(session_id uuid, player_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.sessions;
  v_player public.session_players;
begin
  select *
  into v_session
  from public.sessions
  where room_code = upper(trim(p_room_code))
    and allow_join = true
    and state in ('lobby', 'live')
  limit 1;

  if v_session.id is null then
    raise exception 'Invalid or closed room';
  end if;

  insert into public.session_players (session_id, auth_user_id, display_name)
  values (v_session.id, auth.uid(), trim(p_display_name))
  on conflict (session_id, auth_user_id)
  do update set display_name = excluded.display_name
  returning * into v_player;

  return query select v_session.id, v_player.id;
end;
$$;

grant execute on function public.join_session(text, text) to authenticated;
