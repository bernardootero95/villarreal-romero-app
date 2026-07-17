import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// UTILIDAD SOLID (SRP): Función pura para sumar días hábiles (Salta sábados y domingos)
const sumarDiasHabiles = (fechaBase: Date, diasHabilesAAgregar: number): Date => {
  const fecha = new Date(fechaBase.getTime());
  let diasAgregados = 0;
  
  while (diasAgregados < diasHabilesAAgregar) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay();
    // 0 = Domingo, 6 = Sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }
  return fecha;
};

// UTILIDAD SOLID (SRP): Función pura aislada para generar la plantilla HTML dinámica
const generarPlantillaEmail = (
  usuario: any,
  vtosVencidos: any[],
  tareasVencidas: any[],
  vtosProximos: any[],
  tareasProximas: any[],
  empresaNombre: string,
  colorPrimario: string
) => {
  let htmlContent = `
    <div style="font-family: system-ui, -apple-system, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: ${colorPrimario}; padding: 24px; text-align: center; color: #FFFFFF;">
        <h2 style="margin: 0; font-size: 20px;">${empresaNombre}</h2>
        <p style="margin: 4px 0 0 0; color: #F8FAFC; font-size: 12px; font-weight: bold; text-transform: uppercase; opacity: 0.9;">Agenda Operativa de Control</p>
      </div>
      <div style="padding: 24px; background-color: #FFFFFF;">
        <p style="font-size: 14px; margin-top: 0;">Estimado(a) <strong>${usuario.nombre_completo}</strong>,</p>
        <p style="font-size: 13px; color: #64748B; line-height: 1.5;">Este es el estado actualizado de tus obligaciones asignadas:</p>
  `

  if (vtosVencidos.length > 0 || tareasVencidas.length > 0) {
    htmlContent += `
      <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px 16px; margin-top: 20px; border-radius: 4px;">
        <h3 style="color: #991B1B; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase;">🚨 Actividades Vencidas (Mes Actual)</h3>
        <ul style="font-size: 13px; margin: 0; padding-left: 20px; color: #7F1D1D;">
    `
    vtosVencidos.forEach((v: any) => {
      htmlContent += `<li style="margin-bottom: 4px;"><strong>[${v.fecha_limite}]</strong> ${v.clientes.razon_social} — ${v.impuestos.nombre} (Per: ${v.periodo_fiscal})</li>`
    })
    tareasVencidas.forEach((t: any) => {
      htmlContent += `<li style="margin-bottom: 4px;"><strong>[${t.fecha_limite}]</strong> Tarea: ${t.titulo}</li>`
    })
    htmlContent += `</ul></div>`
  }

  if (vtosProximos.length > 0 || tareasProximas.length > 0) {
    htmlContent += `
      <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 16px; margin-top: 20px; border-radius: 4px;">
        <h3 style="color: #92400E; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase;">⚠️ Próximos Vencimientos (3 días hábiles)</h3>
        <ul style="font-size: 13px; margin: 0; padding-left: 20px; color: #92400E;">
    `
    vtosProximos.forEach((v: any) => {
      htmlContent += `<li style="margin-bottom: 4px;"><strong>[${v.fecha_limite}]</strong> ${v.clientes.razon_social} — ${v.impuestos.nombre}</li>`
    })
    tareasProximas.forEach((t: any) => {
      htmlContent += `<li style="margin-bottom: 4px;"><strong>[${t.fecha_limite}]</strong> Tarea: ${t.titulo}</li>`
    })
    htmlContent += `</ul></div>`
  }

  htmlContent += `
        <p style="font-size: 12px; color: #64748B; margin-top: 32px; border-top: 1px solid #E2E8F0; padding-top: 12px; text-align: center;">
          Ingresa al Sistema de Gestión de <strong>${empresaNombre}</strong> para actualizar el estado de tus obligaciones.<br/>Por favor no respondas a este correo.
        </p>
      </div>
    </div>
  `
  return htmlContent;
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
    
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error("No se ha configurado la variable de entorno RESEND_API_KEY.");
    }

    // Variables Dinámicas de Identidad Corporativa (Marca Blanca)
    const EMPRESA_NOMBRE = Deno.env.get('APP_NAME') || 'Firma Contable';
    const COLOR_PRIMARIO = Deno.env.get('APP_COLOR_PRIMARY') || '#0f172a';

    const hoy = new Date()
    const hoyStr = hoy.toISOString().split('T')[0]
    
    // Rango de búsqueda: Desde el día 1 del mes actual
    const fechaInicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const inicioMesStr = fechaInicioMes.toISOString().split('T')[0]

    // Rango de búsqueda: Hasta 3 días HÁBILES en el futuro
    const fechaCritica = sumarDiasHabiles(hoy, 3);
    const limiteFuturoStr = fechaCritica.toISOString().split('T')[0]

    const { data: usuarios } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre_completo, correo_notificacion')
      .eq('estado', 'ACTIVO')
      .is('eliminado', null)

    if (!usuarios) throw new Error("Fallo recuperando usuarios")

    const { data: vencimientos } = await supabaseAdmin
      .from('vencimientos')
      .select(`fecha_limite, periodo_fiscal, clientes!inner(razon_social, contador_id), impuestos(nombre, especialista_id)`)
      .neq('estado_tarea', 'PRESENTADO')
      .gte('fecha_limite', inicioMesStr)
      .lte('fecha_limite', limiteFuturoStr)

    const { data: tareas } = await supabaseAdmin
      .from('tareas')
      .select('titulo, fecha_limite, usuario_id')
      .eq('estado', 'PENDIENTE')
      .is('eliminado', null)
      .gte('fecha_limite', inicioMesStr)
      .lte('fecha_limite', limiteFuturoStr)

    let totalCorreosEnviados = 0

    for (const usuario of usuarios) {
      if (!usuario.correo_notificacion) continue

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

      const vtosVencidos = vtosAsignados.filter((v: any) => v.fecha_limite < hoyStr)
      const vtosProximos = vtosAsignados.filter((v: any) => v.fecha_limite >= hoyStr)
      
      const tareasVencidas = tareasAsignadas.filter((t: any) => t.fecha_limite < hoyStr)
      const tareasProximas = tareasAsignadas.filter((t: any) => t.fecha_limite >= hoyStr)

      const htmlContent = generarPlantillaEmail(
        usuario, 
        vtosVencidos, 
        tareasVencidas, 
        vtosProximos, 
        tareasProximas, 
        EMPRESA_NOMBRE, 
        COLOR_PRIMARIO
      );

      const resendReq = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${EMPRESA_NOMBRE} Alertas <onboarding@resend.dev>`, 
          to: [usuario.correo_notificacion],
          subject: `🚨 Alerta de Obligaciones - ${EMPRESA_NOMBRE} (${hoyStr})`,
          html: htmlContent
        })
      });

      if (resendReq.ok) {
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