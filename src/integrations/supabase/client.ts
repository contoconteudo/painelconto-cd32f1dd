/**
 * Supabase Client - Configurado para produção
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bpdqqmckynmvmklniwbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHFxbWNreW5tdm1rbG5pd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjY4NTcsImV4cCI6MjA4NTIwMjg1N30.MTsKrCXltmTbGvXr8jLPzA2u1dMzSW3MoTl7uqW6ofU";

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'conto-auth-token',
  },
});

export const isSupabaseConfigured = true;
