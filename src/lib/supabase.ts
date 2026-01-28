/**
 * Supabase Client - Produção
 * 
 * Cliente configurado para conexão com Supabase em produção.
 * As credenciais são carregadas via variáveis de ambiente.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Variáveis de ambiente do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pzeverrrrptauqcdeulx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZXZlcnJycnB0YXVxY2RldWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDk5MzYsImV4cCI6MjA4NTE4NTkzNn0.bN62M65CdVksL1ZNy4t_x-sdZBLXQftZotz8WzPkCMA';

// Verifica se as variáveis estão configuradas
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Cria o cliente Supabase tipado
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        'x-application-name': 'painel-conto',
      },
    },
  }
);

// Log informativo apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.info(
    '%c🚀 Supabase Conectado',
    'color: #10b981; font-weight: bold;',
    `\nURL: ${SUPABASE_URL.substring(0, 30)}...`
  );
}

// Exporta funções utilitárias
export const getSupabaseUrl = () => SUPABASE_URL;
export const getAnonKey = () => SUPABASE_ANON_KEY;
