create or replace function public.join_session(p_room_code text, p_display_name text)
returns table(session_id uuid, player_id uuid)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
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
