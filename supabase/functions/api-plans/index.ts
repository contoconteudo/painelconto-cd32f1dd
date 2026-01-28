/**
 * API Plans - Edge Function
 * 
 * Endpoints:
 * GET    /api-plans        → Listar planos ativos (público)
 * GET    /api-plans?id=X   → Buscar plano específico
 * POST   /api-plans        → Criar plano (admin only)
 * PUT    /api-plans?id=X   → Atualizar plano (admin only)
 * DELETE /api-plans?id=X   → Deletar/desativar plano (admin only)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single()
  
  return !!data
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    // GET pode ser público
    if (req.method === 'GET') {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      if (id) {
        // Buscar plano específico
        const { data: plan, error } = await supabase
          .from('plans')
          .select('*')
          .eq('id', id)
          .single()

        if (error || !plan) {
          return new Response(
            JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Plano não encontrado' } }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ data: plan }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Listar planos ativos
      const { data: plans, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error

      return new Response(
        JSON.stringify({ data: plans }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Métodos que requerem autenticação admin
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
    if (!(await isAdmin(supabase, userId))) {
      return new Response(
        JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Apenas administradores podem gerenciar planos' } }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Criar plano
    if (req.method === 'POST') {
      const body = await req.json()
      
      if (!body.name || !body.price) {
        return new Response(
          JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Nome e preço são obrigatórios' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const planData = {
        name: body.name,
        description: body.description || null,
        price: body.price,
        currency: body.currency || 'BRL',
        interval: body.interval || 'month',
        features: body.features || [],
        is_active: body.is_active !== false,
        stripe_price_id: body.stripe_price_id || null,
      }

      const { data: plan, error } = await supabase
        .from('plans')
        .insert(planData)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data: plan }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT - Atualizar plano
    if (req.method === 'PUT') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'ID do plano é obrigatório' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const updateData = {
        ...body,
        updated_at: new Date().toISOString(),
      }
      delete updateData.id
      delete updateData.created_at

      const { data: plan, error } = await supabase
        .from('plans')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data: plan }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Desativar plano (soft delete)
    if (req.method === 'DELETE') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'ID do plano é obrigatório' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Soft delete - apenas desativa o plano
      const { error } = await supabase
        .from('plans')
        .update({ is_active: false, updated_at: new Date().toISOString() })
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
