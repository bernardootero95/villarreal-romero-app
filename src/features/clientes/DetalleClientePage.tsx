import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useClientes, useClienteImpuestos } from "./useClientes";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Hash,
  Briefcase,
  Calendar,
  AlertCircle,
  Clock,
  Plus,
  FileText,
  Edit2,
} from "lucide-react";
import {
  vencimientosService,
  type Vencimiento,
} from "../calendario/vencimientosService";
import { FichaObligaciones } from "./FichaObligaciones";
import { ClienteForm } from "./ClienteForm";
import { AlertNotification } from "../../components/ui/AlertNotification";

export const DetalleClientePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { perfil } = useAuth();

  // Lectura unificada desde caché reactiva de TanStack Query
  const {
    data: clientes = [],
    isLoading: loadingClientes,
    error: errorClientes,
  } = useClientes();
  const { data: impuestosCargo = [], isLoading: loadingImpuestos } =
    useClienteImpuestos(id!);

  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [loadingVencimientos, setLoadingVencimientos] = useState(true);
  const [showObligacionesModal, setShowObligacionesModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [errorVencimientos, setErrorVencimientos] = useState<string | null>(
    null,
  );

  const cliente = clientes.find((c) => c.id === id);
  const puedeAdministrar =
    perfil && ["Gerente", "Ingeniero"].includes(perfil.cargo);

  useEffect(() => {
    if (!id) return;
    const cargarVencimientosCliente = async () => {
      try {
        setLoadingVencimientos(true);
        setErrorVencimientos(null);
        const hoy = new Date();
        const data = await vencimientosService.getVencimientosMes(
          hoy.getFullYear(),
          hoy.getMonth(),
          "",
          "Gerente",
        );
        const filtrados = data.filter((v) => v.clientes.id === id);
        setVencimientos(filtrados);
      } catch (error) {
        console.error("Error al cargar los vencimientos del cliente:", error);
        setErrorVencimientos(
          "No se pudieron coordinar las agendas de vencimientos del mes en curso.",
        );
      } finally {
        setLoadingVencimientos(false);
      }
    };
    cargarVencimientosCliente();
  }, [id]);

  if (loadingClientes) {
    return (
      <div className="text-center p-8 text-text-muted text-sm font-semibold font-mono uppercase tracking-wider animate-pulse">
        Consultando bóveda de cliente...
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-surface border border-gray-200 rounded-xl shadow-sm my-12 space-y-4 animate-in fade-in duration-200">
        <AlertCircle className="w-12 h-12 text-danger mx-auto stroke-[1.5]" />
        <h3 className="text-lg font-bold text-primary font-title">
          Error 404: Empresa No Encontrada
        </h3>
        <p className="text-xs text-text-muted">
          El registro solicitado no figura en el directorio activo de
          Villarreal-Romero.
        </p>
        <button
          onClick={() => navigate("/clientes")}
          className="bg-primary text-surface text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
        >
          Regresar al Directorio
        </button>
      </div>
    );
  }

  const getBadgeStyles = (estado: string) => {
    switch (estado) {
      case "PRESENTADO":
        return "bg-success/10 text-success border-success/20";
      case "REVISIÓN":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "VENCIDO":
        return "bg-danger/10 text-danger border-danger/20 animate-pulse";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const errorAMostrar = errorClientes?.message || errorVencimientos;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate("/clientes")}
          className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
          Volver
        </button>
        {puedeAdministrar && (
          <button
            onClick={() => setShowForm(true)}
            className="border border-gray-200 bg-surface hover:bg-gray-50 text-text-main text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-text-muted" /> Editar Información
          </button>
        )}
      </div>

      {errorAMostrar && (
        <div className="animate-in fade-in duration-200 max-w-4xl">
          <AlertNotification
            type="error"
            title="Excepción de Control"
            message={errorAMostrar}
          />
        </div>
      )}

      <div className="card-container flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 border border-primary/5">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-title font-bold text-primary">
              {cliente.razon_social}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cliente.estado === "ACTIVO" ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${cliente.estado === "ACTIVO" ? "bg-success" : "bg-danger"}`}
            />{" "}
            CLIENTE {cliente.estado}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-container bg-surface p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-title font-semibold text-primary mb-4 border-b border-gray-100 pb-2">
                Información Legal y Tributaria
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> NIT
                  </span>
                  <p className="text-base font-semibold text-text-main font-mono bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                    {cliente.nit}-{cliente.dv}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Responsable Asignado
                  </span>
                  <p className="text-base font-medium text-primary bg-gray-50 px-3 py-2 rounded-md border border-gray-100 truncate">
                    {cliente.usuarios?.nombre_completo ||
                      "Sin asignar profesional"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-title font-semibold text-primary mb-4 border-b border-gray-100 pb-2">
                Canales Oficiales de Contacto
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Correo Notificaciones
                  </span>
                  <p className="text-sm font-medium text-text-main bg-gray-50 px-3 py-2 rounded-md border border-gray-100 truncate">
                    {cliente.email || (
                      <span className="text-text-muted italic text-xs">
                        No parametrizado
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Celular
                  </span>
                  <p className="text-sm font-semibold text-text-main bg-gray-50 px-3 py-2 rounded-md border border-gray-100 font-mono">
                    {cliente.celular || (
                      <span className="text-text-muted italic text-xs">
                        No parametrizado
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-title font-semibold text-primary">
                  Impuestos y Obligaciones a Cargo
                </h3>
                {puedeAdministrar && (
                  <button
                    onClick={() => setShowObligacionesModal(true)}
                    className="text-xs font-semibold bg-primary text-surface px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Gestionar Obligaciones
                  </button>
                )}
              </div>

              {loadingImpuestos ? (
                <p className="text-xs text-text-muted italic py-2">
                  Sincronizando obligaciones fiscales...
                </p>
              ) : impuestosCargo.length === 0 ? (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-center">
                  <p className="text-xs text-text-muted italic">
                    Esta empresa no tiene obligaciones configuradas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {impuestosCargo.map((obl: any) => (
                    <div
                      key={obl.id}
                      className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-2xs"
                    >
                      <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-semibold text-text-main truncate">
                          {obl.impuestos?.nombre}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono mt-0.5">
                          Periodicidad: {obl.impuestos?.periodicidad}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card-container bg-surface p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-base font-title font-semibold text-primary">
              Vencimientos del Mes
            </h3>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loadingVencimientos ? (
              <p className="text-xs text-text-muted text-center py-4">
                Cargando obligaciones fiscales...
              </p>
            ) : vencimientos.length === 0 ? (
              <div className="text-center py-6 text-text-muted space-y-1">
                <AlertCircle className="w-8 h-8 text-text-muted/60 mx-auto stroke-[1.5]" />
                <p className="text-xs font-medium">
                  Sin obligaciones este mes.
                </p>
              </div>
            ) : (
              vencimientos.map((vencimiento) => (
                <div
                  key={vencimiento.id}
                  className="p-3.5 bg-gray-50 rounded-lg border border-gray-100 space-y-2.5 hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-primary font-title line-clamp-2 flex-1">
                      {vencimiento.impuestos.nombre}
                    </h4>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getBadgeStyles(vencimiento.estado_tarea)}`}
                    >
                      {vencimiento.estado_tarea}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted font-mono pt-1 border-t border-gray-200/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      {new Date(vencimiento.fecha_limite).toLocaleDateString(
                        "es-CO",
                        { timeZone: "UTC" },
                      )}
                    </span>
                    <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                      Per: {vencimiento.periodo_fiscal}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showObligacionesModal && puedeAdministrar && (
        <FichaObligaciones
          cliente={cliente}
          onClose={() => setShowObligacionesModal(false)}
        />
      )}

      {showForm && puedeAdministrar && (
        <ClienteForm
          clienteAEditar={cliente}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
