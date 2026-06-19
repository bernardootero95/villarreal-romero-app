import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. AHORA RECIBIMOS EL CORREO DE NOTIFICACIÓN
    const { 
      email, 
      correo_notificacion, 
      username, 
      nombre_completo, 
      cargo, 
      estado 
    } = await req.json()

    // Validar que vengan los correos
    if (!email) {
      throw new Error("El correo de acceso generado es obligatorio.")
    }

    const passwordTemporal = 'Villarreal2026*'

    // 2. Crear usuario en Auth (Solo con el correo principal de acceso)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: passwordTemporal,
      email_confirm: true,
      user_metadata: { requiere_cambio_clave: true }
    })

    if (authError) throw authError

    // 3. Crear el perfil en la tabla 'usuarios' INCLUYENDO EL NUEVO CAMPO
    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert([
        {
          id: authData.user.id,
          username,
          nombre_completo,
          email, // Se guarda como histórico o referencia
          correo_notificacion, // <-- EL NUEVO CAMPO EN ACCIÓN
          cargo,
          estado
        }
      ])

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw dbError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Usuario creado exitosamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})