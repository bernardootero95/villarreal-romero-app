import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializamos cliente administrativo con Service Role para saltar políticas RLS de lectura
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const hoy = new Date()
    const hoyStr = hoy.toISOString().split('T')[0]

    // 1. Consultar todos los usuarios activos que tengan correo de notificación parametrizado
    const { data: usuarios, error: errUsers } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre_completo, correo_notificacion')
      .eq('estado', 'ACTIVO')
      .is('eliminado', null)

    if (errUsers || !usuarios) throw new Error("Fallo recuperando el catálogo de usuarios: " + errUsers?.message)

    // Calculamos el umbral crítico futuro (Próximos 3 días)
    const fechaCritica = new Date()
    fechaCritica.setDate(hoy.getDate() + 3)
    const limiteFuturoStr = fechaCritica.toISOString().split('T')[0]

    // 2. Extraer todas las obligaciones DIAN del mes inconclusas (Atrasadas e inmediatas)
    const { data: vencimientos, error: errVtos } = await supabaseAdmin
      .from('vencimientos')
      .select(`
        fecha_limite,
        periodo_fiscal,
        clientes!inner ( razon_social, contador_id ),
        impuestos ( nombre, especialista_id )
      `)
      .neq('estado_tarea', 'PRESENTADO')
      .lte('fecha_limite', limiteFuturoStr)

    // 3. Extraer todas las Tareas Internas pendientes
    const { data: tareas, error: errTareas } = await supabaseAdmin
      .from('tareas')
      .select('titulo, fecha_limite, usuario_id')
      .eq('estado', 'PENDIENTE')
      .is('eliminado', null)

    let totalCorreosEnviados = 0

    // 4. Mapear y procesar la agenda específica por cada miembro del equipo (SRP)
    for (const usuario of usuarios) {
      if (!usuario.correo_notificacion) continue

      // Validar si ya se le envió un reporte de alerta el día de hoy para mitigar spam de reintentos
      const { data: yaEnviado } = await supabaseAdmin
        .from('notificaciones_enviadas')
        .select('id')
        .eq('usuario_id', usuario.id)
        .eq('tipo_alerta', 'DIARIA_CRITICA')
        .eq('fecha_despacho', hoyStr)
        .maybeSingle()

      if (yaEnviado) continue

      // Filtrar vencimientos donde el usuario sea Contador Responsable o Especialista del Impuesto
      const vtosAsignados = (vencimientos || []).filter((v: any) => 
        v.clientes.contador_id === usuario.id || v.impuestos.especialista_id === usuario.id
      )

      // Filtrar sus tareas internas pendientes
      const tareasAsignadas = (tareas || []).filter((t: any) => t.usuario_id === usuario.id)

      if (vtosAsignados.length === 0 && tareasAsignadas.length === 0) continue

      // Construcción del cuerpo del reporte en HTML limpio y corporativo
      let htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #1E2A3A; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0D2E5E; padding: 24px; text-align: center; color: #FFFFFF;">
            <h2 style="margin: 0; font-family: 'Raleway', sans-serif; font-size: 20px;">Villarreal-Romero Asesorías Contables</h2>
            <p style="margin: 4px 0 0 0; color: #C9A84C; font-size: 12px; font-weight: bold; tracking-wide: uppercase;">Resumen Diario de Obligaciones</p>
          </div>
          <div style="padding: 24px; background-color: #FFFFFF;">
            <p style="font-size: 14px; margin-top: 0;">Estimado(a) <strong>${usuario.nombre_completo}</strong>,</p>
            <p style="font-size: 13px; color: #6B7A8D; line-height: 1.5;">A continuación, se detalla el estado de control de actividades críticas pendientes bajo tu responsabilidad en la plataforma:</p>
      `

      if (vtosAsignados.length > 0) {
        htmlContent += `
          <h3 style="color: #0D2E5E; font-size: 14px; margin-top: 20px; border-bottom: 2px solid #F4F6F9; padding-bottom: 6px;">⚠️ VENCIMIENTOS TRIBUTARIOS DEL PERIODO</h3>
          <ul style="padding-left: 20px; margin-top: 10px; font-size: 13px; line-height: 1.6;">
        `
        vtosAsignados.forEach((v: any) => {
          const esAtrasado = v.fecha_limite < hoyStr
          const marcaEstilo = esAtrasado ? 'color: #C0392B; font-weight: bold;' : 'color: #1E2A3A;'
          htmlContent += `
            <li style="margin-bottom: 8px; ${marcaEstilo}">
              [${v.fecha_limite}] ${v.clientes.razon_social} — ${v.impuestos.nombre} (Per: ${v.periodo_fiscal}) ${esAtrasado ? '<strong>(VENCIDO)</strong>' : ''}
            </li>
          `
        })
        htmlContent += `</ul>`
      }

      if (tareasAsignadas.length > 0) {
        htmlContent += `
          <h3 style="color: #0D2E5E; font-size: 14px; margin-top: 24px; border-bottom: 2px solid #F4F6F9; padding-bottom: 6px;">📋 TAREAS INTERNAS PENDIENTES</h3>
          <ul style="padding-left: 20px; margin-top: 10px; font-size: 13px; line-height: 1.6; color: #1E2A3A;">
        `
        tareasAsignadas.forEach((t: any) => {
          const esAtrasada = t.fecha_limite < hoyStr
          htmlContent += `
            <li style="margin-bottom: 8px; ${esAtrasada ? 'color: #C0392B;' : ''}">
              [Límite: ${t.fecha_limite}] ${t.titulo} ${esAtrasada ? '<strong>(Atrasada)</strong>' : ''}
            </li>
          `
        })
        htmlContent += `</ul>`
      }

      htmlContent += `
            <p style="font-size: 12px; color: #6B7A8D; margin-top: 32px; border-top: 1px solid #E2E8F0; pt: 12px; text-align: center;">
              Este es un recordatorio automático generado por el Sistema de Gestión de Villarreal-Romero. Por favor no respondas a este correo.
            </p>
          </div>
        </div>
      `

      // 5. Despacho mediante el proveedor SMTP configurado en el ecosistema (Utiliza los tokens de Supabase Auth nativos)
      // Nota: Si usas Resend, SendGrid o Mailgun por API, puedes reemplazar este fetch por su endpoint HTTP directamente aquí.
      const { error: sendError } = await supabaseAdmin.auth.admin.inviteUserByEmail(usuario.correo_notificacion, {
        redirectTo: Deno.env.get('SITE_URL') ?? 'http://localhost:3000',
        data: {
          custom_html: htmlContent, // Si tu proveedor soporta inyección HTML, o bien usa el despachador SMTP nativo configurado en config.toml
          subject_override: `Villarreal-Romero: Resumen de Obligaciones Pendientes (${hoyStr})`
        }
      })

      // Para este ejemplo de producción, asumimos que tienes enlazado un microservicio SMTP o HTTP API (como Resend).
      // Despachamos un log de auditoría interna para congelar futuros envíos del día
      if (!sendError) {
        await supabaseAdmin
          .from('notificaciones_enviadas')
          .insert([{ usuario_id: usuario.id, tipo_alerta: 'DIARIA_CRITICA', correo_destino: usuario.correo_notificacion }])
        totalCorreosEnviados++
      }
    }

    return new Response(
      JSON.stringify({ success: true, mensajes_enviados: totalCorreosEnviados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})