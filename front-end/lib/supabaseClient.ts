import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!

// Client for frontend operations (with auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
