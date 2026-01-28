/**
 * API Admin Users - Edge Function
 * 
 * Endpoints:
 * GET    /api-admin-users        → Listar todos os usuários (admin only)
 * GET    /api-admin-users?id=X   → Buscar usuário específico (admin only)
 * POST   /api-admin-users        → Criar usuário (admin only)
 * PUT    /api-admin-users?id=X   → Atualizar usuário (admin only)
 * DELETE /api-admin-users?id=X   → Deletar usuário (admin only)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Token de autenticação necessário' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Verificar claims do token
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token)
    
    if (claimsError || !claims.user) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Token inválido' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claims.user.id

    // Verificar se é admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Apenas administradores podem acessar esta API' } }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    // GET - Listar ou buscar por ID
    if (req.method === 'GET') {
      if (id) {
        // Buscar usuário específico
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*, user_roles(role)')
          .eq('id', id)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' } }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ data: profile }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Listar todos
      const { data: profiles, error, count } = await supabase
        .from('profiles')
        .select('*, user_roles(role)', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ data: profiles, count }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Criar usuário
    if (req.method === 'POST') {
      const body = await req.json()
      const { email, password, name, role = 'user' } = body

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Email e senha são obrigatórios' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Criar usuário via Supabase Auth (usando service role key seria ideal)
      // Por segurança, esta operação deveria usar a service_role key
      // Em produção, considere usar a Admin API do Supabase
      
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'NOT_IMPLEMENTED', 
            message: 'Criação de usuários deve ser feita via Supabase Dashboard ou usando service_role key em ambiente seguro' 
          } 
        }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT - Atualizar usuário
    if (req.method === 'PUT') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'ID do usuário é obrigatório' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const { name, phone, avatar_url, role } = body

      // Atualizar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({ name, phone, avatar_url, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (profileError) throw profileError

      // Atualizar role se fornecido
      if (role) {
        await supabase
          .from('user_roles')
          .upsert({ user_id: id, role }, { onConflict: 'user_id,role' })
      }

      return new Response(
        JSON.stringify({ data: profile }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Deletar usuário
    if (req.method === 'DELETE') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'ID do usuário é obrigatório' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Deletar perfil (cascade deleta roles também)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(null, { status: 204, headers: corsHeaders })
    }

    return new Response(
      JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido' } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('API Error:', error)
    const message = error instanceof Error ? error.message : 'Erro interno do servidor'
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
