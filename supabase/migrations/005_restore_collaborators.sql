-- Restore game_collaborators table if it was accidentally dropped.
-- RLS policies on games/questions/question_options reference this table;
-- without it every query to those tables throws a 500 error.

create table if not exists public.game_collaborators (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  collaborator_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (game_id, collaborator_user_id)
);

alter table public.game_collaborators enable row level security;

-- Re-create policies idempotently (drop first, then create)
drop policy if exists "owners_manage_collaborators" on public.game_collaborators;
create policy "owners_manage_collaborators"
  on public.game_collaborators for all to authenticated
  using (game_id in (select id from public.games where host_user_id = auth.uid()))
  with check (game_id in (select id from public.games where host_user_id = auth.uid()));

drop policy if exists "collaborators_see_own_entries" on public.game_collaborators;
create policy "collaborators_see_own_entries"
  on public.game_collaborators for select to authenticated
  using (collaborator_user_id = auth.uid());

-- Policies on other tables (safe to re-apply with drop-first)
drop policy if exists "collaborators_read_shared_games" on public.games;
create policy "collaborators_read_shared_games"
  on public.games for select to authenticated
  using (id in (select game_id from public.game_collaborators where collaborator_user_id = auth.uid()));

drop policy if exists "collaborators_write_questions" on public.questions;
create policy "collaborators_write_questions"
  on public.questions for all to authenticated
  using (game_id in (select game_id from public.game_collaborators where collaborator_user_id = auth.uid()))
  with check (game_id in (select game_id from public.game_collaborators where collaborator_user_id = auth.uid()));

drop policy if exists "collaborators_write_options" on public.question_options;
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

-- Restore invite_collaborator RPC
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
