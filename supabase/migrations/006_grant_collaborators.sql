-- Grant missing permissions on game_collaborators to authenticated/anon/service_role.
-- Without these grants, PostgreSQL throws "permission denied for table game_collaborators"
-- whenever any RLS policy subqueries it (games, questions, question_options, sessions),
-- causing 500 errors on all those tables and blocking question saves.

grant all on table public.game_collaborators to authenticated;
grant all on table public.game_collaborators to anon;
grant all on table public.game_collaborators to service_role;

-- Also ensure sequence grants (if table was created fresh)
grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to anon;

-- Reload PostgREST schema cache so it picks up the restored table
notify pgrst, 'reload schema';
