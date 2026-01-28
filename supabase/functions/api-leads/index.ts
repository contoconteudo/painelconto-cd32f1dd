/**
 * API Leads - Edge Function
 * 
 * Endpoints:
 * GET    /api-leads        → Listar leads do usuário autenticado
 * GET    /api-leads?id=X   → Buscar lead específico
 * POST   /api-leads        → Criar lead
 * PUT    /api-leads?id=X   → Atualizar lead próprio
 * DELETE /api-leads?id=X   → Deletar lead próprio
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
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    // GET - Listar ou buscar por ID
    if (req.method === 'GET') {
      if (id) {
        // Buscar lead específico (verificando ownership)
        const { data: lead, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single()

        if (error || !lead) {
          return new Response(
            JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Lead não encontrado' } }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ data: lead }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Query params para filtros
      const stage = url.searchParams.get('stage')
      const temperature = url.searchParams.get('temperature')
      const spaceId = url.searchParams.get('space_id')
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '20')

      // Listar leads do usuário com filtros
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      if (stage) query = query.eq('stage', stage)
      if (temperature) query = query.eq('temperature', temperature)
      if (spaceId) query = query.eq('space_id', spaceId)

      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data: leads, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          data: leads, 
          count, 
          page,
          totalPages: Math.ceil((count || 0) / limit)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Criar lead
    if (req.method === 'POST') {
      const body = await req.json()
      
      if (!body.name) {
        return new Response(
          JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Nome do lead é obrigatório' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const leadData = {
        user_id: userId,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        stage: body.stage || 'prospeccao',
        temperature: body.temperature || 'warm',
        value: body.value || null,
        source: body.source || null,
        notes: body.notes || null,
        next_contact: body.next_contact || null,
        space_id: body.space_id || null,
      }

      const { data: lead, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data: lead }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT - Atualizar lead
    if (req.method === 'PUT') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'ID do lead é obrigatório' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar ownership
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        return new Response(
          JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Você não tem permissão para editar este lead' } }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const updateData = {
        ...body,
        updated_at: new Date().toISOString(),
      }
      // Remover campos que não devem ser atualizados
      delete updateData.id
      delete updateData.user_id
      delete updateData.created_at

      const { data: lead, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data: lead }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Deletar lead
    if (req.method === 'DELETE') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'ID do lead é obrigatório' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar ownership antes de deletar
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        return new Response(
          JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Você não tem permissão para deletar este lead' } }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('leads')
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
