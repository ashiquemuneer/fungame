-- Collaborators table so hosts can share games for co-editing
create table if not exists public.game_collaborators (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  collaborator_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (game_id, collaborator_user_id)
);

alter table public.game_collaborators enable row level security;

-- Game owners manage collaborators for their own games
create policy "owners_manage_collaborators"
  on public.game_collaborators for all to authenticated
  using (game_id in (select id from public.games where host_user_id = auth.uid()))
  with check (game_id in (select id from public.games where host_user_id = auth.uid()));

-- Collaborators can see their own entries
create policy "collaborators_see_own_entries"
  on public.game_collaborators for select to authenticated
  using (collaborator_user_id = auth.uid());

-- Collaborators can read shared games
create policy "collaborators_read_shared_games"
  on public.games for select to authenticated
  using (id in (select game_id from public.game_collaborators where collaborator_user_id = auth.uid()));

-- Collaborators can edit questions in shared games
create policy "collaborators_write_questions"
  on public.questions for all to authenticated
  using (game_id in (select game_id from public.game_collaborators where collaborator_user_id = auth.uid()))
  with check (game_id in (select game_id from public.game_collaborators where collaborator_user_id = auth.uid()));

-- Collaborators can edit question options
create policy "collaborators_write_options"
  on public.question_options for all to authenticated
  using (
    question_id in (
      select q.id from public.questions q
      join public.game_collaborators gc on gc.game_id = q.game_id
      where gc.collaborator_user_id = auth.uid()
    )
  )
  with check (
    question_id in (
      select q.id from public.questions q
      join public.game_collaborators gc on gc.game_id = q.game_id
      where gc.collaborator_user_id = auth.uid()
    )
  );

-- RPC: invite a collaborator by email (security definer so we can read auth.users)
create or replace function public.invite_collaborator(p_game_id uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_collaborator_id uuid;
begin
  if not exists (select 1 from public.games where id = p_game_id and host_user_id = auth.uid()) then
    raise exception 'Game not found or permission denied';
  end if;

  select id into v_collaborator_id
  from auth.users
  where lower(email) = lower(trim(p_email))
    and (is_anonymous is null or is_anonymous = false)
  limit 1;

  if v_collaborator_id is null then
    raise exception 'No host account found for that email address';
  end if;

  if v_collaborator_id = auth.uid() then
    raise exception 'You cannot invite yourself';
  end if;

  insert into public.game_collaborators (game_id, collaborator_user_id, invited_by_user_id)
  values (p_game_id, v_collaborator_id, auth.uid())
  on conflict (game_id, collaborator_user_id) do nothing;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.invite_collaborator(uuid, text) to authenticated;
