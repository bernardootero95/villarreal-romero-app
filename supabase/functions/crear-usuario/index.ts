import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CARGOS_PERMITIDOS_ADMIN = ['Gerente', 'Ingeniero']
const CARGOS_VALIDOS = ['Gerente', 'Contador', 'Auxiliar', 'Asistente', 'Ingeniero', 'Practicante']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Autenticamos al llamador a partir de su propio JWT (no de un admin_id enviado en el body)
    const authHeader = req.headers.get('Authorization')
    const jwt = authHeader?.replace('Bearer ', '')
    if (!jwt) {
      throw new Error('No autenticado.')
    }

    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(jwt)
    if (callerError || !caller) {
      throw new Error('Sesión inválida o expirada.')
    }

    const { data: perfilAdmin } = await supabaseAdmin
      .from('usuarios')
      .select('cargo')
      .eq('id', caller.id)
      .single()

    if (!perfilAdmin || !CARGOS_PERMITIDOS_ADMIN.includes(perfilAdmin.cargo)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado para crear usuarios.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

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

    if (!CARGOS_VALIDOS.includes(cargo)) {
      throw new Error("El cargo asignado no es válido.")
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
    const { data: nuevoUsuario, error: dbError } = await supabaseAdmin
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
      .select()
      .single()

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw dbError
    }

    // Esta creación corre con SERVICE_ROLE_KEY (auth.uid() es NULL para el trigger automático
    // de auditoría), así que registramos aquí explícitamente con el id del llamador ya
    // verificado arriba.
    await supabaseAdmin.from('auditoria').insert({
      usuario_id: caller.id,
      accion: 'CREAR',
      modulo: 'USUARIOS',
      registro_id: nuevoUsuario.id,
      datos_previos: null,
      datos_nuevos: nuevoUsuario
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Usuario creado exitosamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido.'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})