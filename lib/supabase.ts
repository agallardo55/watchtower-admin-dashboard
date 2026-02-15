import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://txlbhwvlzbceegzkoimr.supabase.co';
export const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bGJod3ZsemJjZWVnemtvaW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzg1MjUsImV4cCI6MjA4NTcxNDUyNX0.OfWnAF0SXt3oZfz-cpjfhb2ZnaH0gsEZNxLAD3ZOyiA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
