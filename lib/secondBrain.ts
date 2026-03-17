import { createClient } from '@supabase/supabase-js';

const secondBrainUrl = import.meta.env.VITE_SECOND_BRAIN_URL;
const secondBrainAnonKey = import.meta.env.VITE_SECOND_BRAIN_ANON_KEY;

if (!secondBrainUrl || !secondBrainAnonKey) {
  console.error('Missing VITE_SECOND_BRAIN_URL or VITE_SECOND_BRAIN_ANON_KEY. Check .env file.');
}

export const secondBrain = createClient(secondBrainUrl || '', secondBrainAnonKey || '');
