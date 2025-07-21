import { supabase } from '@/lib/supabaseClient';

export async function getProfile(address: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('address', address)
    .single();
  if (error) throw error;
  return data;
}

export async function upsertProfile(profile: {
  address: string;
  username?: string;
  display_name?: string;
  tagline?: string;
  biography?: string;
  location?: string;
  website?: string;
  twitter?: string;
  email?: string;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert([profile], { onConflict: 'address' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
