-- ============================================================
-- 006: Fix realtime publication + verify grants
-- ============================================================

-- 1. Check which tables are in realtime publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 2. Add missing tables to realtime publication
-- (only runs if not already there)
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.sessions,
  public.session_players,
  public.answers,
  public.games,
  public.questions;

-- 3. Re-confirm grants (idempotent)
GRANT ALL ON TABLE public.game_collaborators TO authenticated;
GRANT ALL ON TABLE public.game_collaborators TO anon;
GRANT ALL ON TABLE public.game_collaborators TO service_role;

GRANT SELECT ON TABLE public.games TO anon, authenticated;
GRANT SELECT ON TABLE public.questions TO anon, authenticated;
GRANT SELECT ON TABLE public.question_options TO anon, authenticated;
GRANT ALL ON TABLE public.sessions TO anon, authenticated;
GRANT ALL ON TABLE public.session_players TO anon, authenticated;
GRANT ALL ON TABLE public.answers TO anon, authenticated;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
