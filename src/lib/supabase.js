import { createClient } from '@supabase/supabase-js';

// These will be loaded from .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase Environment Variables. Check .env.local');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
