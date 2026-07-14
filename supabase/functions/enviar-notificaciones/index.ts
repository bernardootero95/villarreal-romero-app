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
    // 1. Inicialización de Clientes (Supabase + Resend Key)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Obtenemos la llave de Resend desde los secretos del entorno
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error("No se ha configurado la variable de entorno RESEND_API_KEY.");
    }

    const hoy = new Date()
    const hoyStr = hoy.toISOString().split('T')[0]

    // 2. Extracción de Usuarios Activos
    const { data: usuarios, error: errUsers } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre_completo, correo_notificacion')
      .eq('estado', 'ACTIVO')
      .is('eliminado', null)

    if (errUsers || !usuarios) throw new Error("Fallo recuperando usuarios: " + errUsers?.message)

    // Umbral crítico: 3 días a futuro
    const fechaCritica = new Date()
    fechaCritica.setDate(hoy.getDate() + 3)
    const limiteFuturoStr = fechaCritica.toISOString().split('T')[0]

    // 3. Extracción de Vencimientos DIAN y Tareas Internas
    const { data: vencimientos } = await supabaseAdmin
      .from('vencimientos')
      .select(`fecha_limite, periodo_fiscal, clientes!inner(razon_social, contador_id), impuestos(nombre, especialista_id)`)
      .neq('estado_tarea', 'PRESENTADO')
      .lte('fecha_limite', limiteFuturoStr)

    const { data: tareas } = await supabaseAdmin
      .from('tareas')
      .select('titulo, fecha_limite, usuario_id')
      .eq('estado', 'PENDIENTE')
      .is('eliminado', null)

    let totalCorreosEnviados = 0

    // 4. Orquestación y Despacho por Usuario
    for (const usuario of usuarios) {
      if (!usuario.correo_notificacion) continue

      // Control de Duplicados
      const { data: yaEnviado } = await supabaseAdmin
        .from('notificaciones_enviadas')
        .select('id')
        .eq('usuario_id', usuario.id)
        .eq('tipo_alerta', 'DIARIA_CRITICA')
        .eq('fecha_despacho', hoyStr)
        .maybeSingle()

      if (yaEnviado) continue

      const vtosAsignados = (vencimientos || []).filter((v: any) => 
        v.clientes.contador_id === usuario.id || v.impuestos.especialista_id === usuario.id
      )
      const tareasAsignadas = (tareas || []).filter((t: any) => t.usuario_id === usuario.id)

      if (vtosAsignados.length === 0 && tareasAsignadas.length === 0) continue

      // Construcción del HTML Corporativo
      let htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #1E2A3A; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0D2E5E; padding: 24px; text-align: center; color: #FFFFFF;">
            <h2 style="margin: 0; font-size: 20px;">Villarreal-Romero Asesorías Contables</h2>
            <p style="margin: 4px 0 0 0; color: #C9A84C; font-size: 12px; font-weight: bold; text-transform: uppercase;">Resumen Diario de Obligaciones</p>
          </div>
          <div style="padding: 24px; background-color: #FFFFFF;">
            <p style="font-size: 14px; margin-top: 0;">Estimado(a) <strong>${usuario.nombre_completo}</strong>,</p>
            <p style="font-size: 13px; color: #6B7A8D; line-height: 1.5;">Este es el estado de control de actividades críticas bajo tu responsabilidad:</p>
      `

      if (vtosAsignados.length > 0) {
        htmlContent += `<h3 style="color: #0D2E5E; font-size: 14px; border-bottom: 2px solid #F4F6F9; padding-bottom: 6px;">⚠️ VENCIMIENTOS OFICIALES</h3><ul style="font-size: 13px;">`
        vtosAsignados.forEach((v: any) => {
          const esAtrasado = v.fecha_limite < hoyStr
          htmlContent += `<li style="margin-bottom: 8px; ${esAtrasado ? 'color: #C0392B; font-weight: bold;' : ''}">[${v.fecha_limite}] ${v.clientes.razon_social} — ${v.impuestos.nombre} ${esAtrasado ? '(VENCIDO)' : ''}</li>`
        })
        htmlContent += `</ul>`
      }

      if (tareasAsignadas.length > 0) {
        htmlContent += `<h3 style="color: #0D2E5E; font-size: 14px; border-bottom: 2px solid #F4F6F9; padding-bottom: 6px;">📋 TAREAS INTERNAS</h3><ul style="font-size: 13px;">`
        tareasAsignadas.forEach((t: any) => {
          const esAtrasada = t.fecha_limite < hoyStr
          htmlContent += `<li style="margin-bottom: 8px; ${esAtrasada ? 'color: #C0392B;' : ''}">[${t.fecha_limite}] ${t.titulo} ${esAtrasada ? '<strong>(Atrasada)</strong>' : ''}</li>`
        })
        htmlContent += `</ul>`
      }

      htmlContent += `
            <p style="font-size: 12px; color: #6B7A8D; margin-top: 32px; border-top: 1px solid #E2E8F0; padding-top: 12px; text-align: center;">
              Mensaje automático del Sistema de Gestión Villarreal-Romero.
            </p>
          </div>
        </div>
      `

      // 5. Invocación limpia a la API de Resend
      const resendReq = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Villarreal-Romero Alertas <onboarding@resend.dev>', // Usamos el correo de pruebas de Resend por defecto
          to: [usuario.correo_notificacion],
          subject: `Resumen de Obligaciones Pendientes (${hoyStr})`,
          html: htmlContent
        })
      });

      if (resendReq.ok) {
        // Registramos en bitácora para no duplicar correos
        await supabaseAdmin
          .from('notificaciones_enviadas')
          .insert([{ usuario_id: usuario.id, tipo_alerta: 'DIARIA_CRITICA', correo_destino: usuario.correo_notificacion }])
        totalCorreosEnviados++
      } else {
        const errorText = await resendReq.text();
        console.error(`Error enviando correo a ${usuario.correo_notificacion}:`, errorText);
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