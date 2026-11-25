import { createClient } from '@supabase/supabase-js'

// Anon key aman berada di frontend, karena akses dibatasi Row Level Security.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
