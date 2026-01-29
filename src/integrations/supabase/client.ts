/**
 * Supabase Client - Configurado para produção
 * 
 * Credenciais do novo projeto Supabase (Janeiro 2026).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Credenciais do projeto Supabase
const SUPABASE_URL = "https://jqthecutclccbakzadax.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdGhlY3V0Y2xjY2Jha3phZGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc3MDksImV4cCI6MjA4NTI1MzcwOX0.qI8irQ1ldRmqMThdm9HW4c7dVIDJrNCPz09gWVDTJRM";

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
