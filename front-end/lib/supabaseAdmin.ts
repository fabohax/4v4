import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: '4v4-supabase-admin',
    autoRefreshToken: false,
    persistSession: false,
  },
});
