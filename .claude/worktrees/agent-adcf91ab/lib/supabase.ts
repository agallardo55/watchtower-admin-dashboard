import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check .env file.');
}

const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export { supabaseUrl, supabaseAnonKey };
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceRoleKey || '');
