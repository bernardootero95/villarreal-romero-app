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

    const { usuario_id, nueva_clave, admin_id } = await req.json()

    
    const { data: perfilAdmin } = await supabaseClient
      .from('usuarios')
      .select('cargo')
      .eq('id', admin_id)
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

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})