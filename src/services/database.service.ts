/**
 * Database Service - Supabase
 * 
 * Serviço genérico para operações CRUD com Supabase.
 * Fornece abstração type-safe para todas as tabelas.
 */

import { supabase } from '@/lib/supabase';
import type { ApiResponse, ApiError, PaginatedResponse } from '@/types/database.types';

// ============================================
// TYPES
// ============================================

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  search?: {
    column: string;
    query: string;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const handleError = (error: unknown): ApiError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: (error as { message: string }).message,
      code: (error as { code?: string }).code,
      details: (error as { details?: string }).details,
    };
  }
  return { message: 'Erro desconhecido' };
};

// ============================================
// GENERIC CRUD OPERATIONS
// ============================================

/**
 * Busca todos os registros de uma tabela
 */
export async function getAll<T>(
  table: string,
  options?: QueryOptions
): Promise<ApiResponse<T[]>> {
  try {
    let query = supabase.from(table).select('*', { count: 'exact' });

    // Aplicar filtros
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Aplicar busca
    if (options?.search) {
      query = query.ilike(options.search.column, `%${options.search.query}%`);
    }

    // Aplicar ordenação
    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc',
      });
    }

    // Aplicar paginação
    if (options?.page && options?.pageSize) {
      const from = (options.page - 1) * options.pageSize;
      const to = from + options.pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data: data as T[], error: null, count: count || undefined };
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    return { data: null, error: handleError(error) };
  }
}

/**
 * Busca registros com paginação
 */
export async function getPaginated<T>(
  table: string,
  options: QueryOptions
): Promise<PaginatedResponse<T>> {
  const page = options.page || 1;
  const pageSize = options.pageSize || 10;

  const result = await getAll<T>(table, options);

  const totalCount = result.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: result.data || [],
    count: totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Busca um registro por ID
 */
export async function getById<T>(
  table: string,
  id: string
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { data: data as T, error: null };
  } catch (error) {
    console.error(`Error fetching ${table} by ID:`, error);
    return { data: null, error: handleError(error) };
  }
}

/**
 * Cria um novo registro
 */
export async function create<T>(
  table: string,
  insertData: Record<string, unknown>
): Promise<ApiResponse<T>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error } = await (supabase.from(table) as any)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return { data: created as T, error: null };
  } catch (error) {
    console.error(`Error creating ${table}:`, error);
    return { data: null, error: handleError(error) };
  }
}

/**
 * Atualiza um registro existente
 */
export async function update<T>(
  table: string,
  id: string,
  updateData: Record<string, unknown>
): Promise<ApiResponse<T>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase.from(table) as any)
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data: updated as T, error: null };
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    return { data: null, error: handleError(error) };
  }
}

/**
 * Remove um registro
 */
export async function remove(
  table: string,
  id: string
): Promise<{ error: ApiError | null }> {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error(`Error deleting ${table}:`, error);
    return { error: handleError(error) };
  }
}

/**
 * Query customizada com filtros avançados
 */
export async function query<T>(
  table: string,
  callback: (query: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>
): Promise<ApiResponse<T[]>> {
  try {
    const baseQuery = supabase.from(table);
    const { data, error } = await callback(baseQuery);

    if (error) throw error;

    return { data: data as T[], error: null };
  } catch (error) {
    console.error(`Error querying ${table}:`, error);
    return { data: null, error: handleError(error) };
  }
}

/**
 * Upsert (insert or update)
 */
export async function upsert<T>(
  table: string,
  upsertData: Record<string, unknown>,
  options?: { onConflict?: string }
): Promise<ApiResponse<T>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error } = await (supabase.from(table) as any)
      .upsert(upsertData, {
        onConflict: options?.onConflict,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: result as T, error: null };
  } catch (error) {
    console.error(`Error upserting ${table}:`, error);
    return { data: null, error: handleError(error) };
  }
}

/**
 * Batch insert
 */
export async function batchInsert<T>(
  table: string,
  items: Record<string, unknown>[]
): Promise<ApiResponse<T[]>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error } = await (supabase.from(table) as any)
      .insert(items)
      .select();

    if (error) throw error;

    return { data: result as T[], error: null };
  } catch (error) {
    console.error(`Error batch inserting ${table}:`, error);
    return { data: null, error: handleError(error) };
  }
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export function subscribeToTable(
  table: string,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) => void
) {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as Record<string, unknown>,
          old: payload.old as Record<string, unknown>,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
