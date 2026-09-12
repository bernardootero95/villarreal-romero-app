import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', 
      { auth: { persistSession: false } }
    )

    const { usuario_id, nueva_clave } = await req.json()

    // Autenticamos al llamador a partir de su propio JWT (no de un admin_id enviado en el body)
    const authHeader = req.headers.get('Authorization')
    const jwt = authHeader?.replace('Bearer ', '')
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'No autenticado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser(jwt)
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Sesión inválida o expirada.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { data: perfilAdmin } = await supabaseClient
      .from('usuarios')
      .select('cargo')
      .eq('id', caller.id)
      .single()

    if (!perfilAdmin || !['Gerente', 'Ingeniero'].includes(perfilAdmin.cargo)) {
      return new Response(JSON.stringify({ error: 'No autorizado para realizar esta acción técnico-administrativa.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    
    const { error } = await supabaseClient.auth.admin.updateUserById(usuario_id, {
      password: nueva_clave
    })

    if (error) throw error

    return new Response(JSON.stringify({ exito: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido.'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})