import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

// Supabase client configured with the service_role key to bypass RLS for administrative/worker tasks
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

