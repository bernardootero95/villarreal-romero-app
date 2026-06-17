import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// Configuración de CORS para permitir peticiones desde nuestro frontend (Vite)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar la petición preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Inicializar el cliente de Supabase con permisos de Administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 2. Extraer los datos enviados desde React
    const { username, email, nombre_completo, cargo, admin_id } = await req.json()
    
    // Validar datos básicos
    if (!username || !nombre_completo || !cargo) {
      throw new Error('Faltan datos obligatorios')
    }

    const internalEmail = email || `${username.toLowerCase()}@villarreal-romero.local`

    // 3. Crear el usuario en auth.users (Autenticación Segura)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: 'Cambiar123!', // Contraseña por defecto para nuevos miembros
      email_confirm: true,
      user_metadata: { username, nombre_completo, cargo }
    })

    if (authError) throw authError

    const nuevoUserId = authData.user.id

    // 4. Insertar en la tabla public.usuarios
    const { data: publicUser, error: publicError } = await supabaseAdmin
      .from('usuarios')
      .insert([{
        id: nuevoUserId,
        username,
        email: internalEmail,
        nombre_completo,
        cargo,
        estado: 'ACTIVO'
      }])
      .select()
      .single()

    if (publicError) {
      // Rollback manual si falla la inserción pública (buenas prácticas)
      await supabaseAdmin.auth.admin.deleteUser(nuevoUserId)
      throw publicError
    }

    // 5. Registrar en Auditoría
    if (admin_id) {
      await supabaseAdmin.from('auditoria').insert({
        usuario_id: admin_id,
        accion: 'CREAR',
        modulo: 'USUARIOS',
        registro_id: nuevoUserId,
        datos_nuevos: publicUser
      })
    }

    // 6. Retornar éxito
    return new Response(
      JSON.stringify(publicUser),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})