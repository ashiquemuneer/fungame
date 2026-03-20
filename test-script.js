import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(url, anonKey)

async function test() {
  console.log("Checking sessions table for 4AXPTQ...")
  const { data: session, error: err1 } = await supabase.from('sessions').select('*').eq('room_code', '4AXPTQ')
  console.log("Sessions:", session, err1?.message)

  console.log("Checking games table...")
  const { data: games, error: err2 } = await supabase.from('games').select('id, title').limit(5)
  console.log("Games:", games, err2?.message)

  // Try calling the RPC directly!
  const { data: rpcData, error: rpcErr } = await supabase.rpc('join_session', {
    p_room_code: '4AXPTQ',
    p_display_name: 'testuser'
  })
  console.log("RPC result:", rpcData, "RPC Error:", rpcErr?.message, rpcErr?.details, rpcErr?.hint)
}

test()
