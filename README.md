# Villarreal-Romero | Sistema de Gestión y Vencimientos Tributarios

Aplicación web interna diseñada específicamente para la firma contable **Villarreal-Romero**. El sistema permite la gestión eficiente del equipo de trabajo, el directorio de clientes, y el control automatizado del calendario de vencimientos y obligaciones tributarias.

## 🚀 Tecnologías y Stack

El proyecto está construido bajo una arquitectura moderna sin servidor (Serverless), separando claramente el Frontend del Backend (BaaS) y siguiendo los principios **SOLID**.

### Frontend

- **Core:** React 18, TypeScript, Vite.
- **Enrutamiento:** React Router DOM v6 (Rutas anidadas y protegidas por roles).
- **Estilos:** Tailwind CSS (Diseño responsive y variables corporativas).
- **Iconografía:** Lucide React.
- **Manejo de Formularios:** React Hook Form + Zod (Validación estricta y tipado inferido).

### Backend & Base de Datos

- **BaaS:** Supabase.
- **Base de Datos:** PostgreSQL (Relacional, RLS Policies).
- **Autenticación:** Supabase Auth (Estrategia de correos internos auto-generados `@villarreal-romero.local`).
- **Serverless:** Edge Functions en Deno (Para creación segura de usuarios desde el cliente).

---

## 📦 Módulos Principales

1.  **Autenticación y Seguridad:**
    - Login seguro con validación inmediata.
    - Generación automática de correos corporativos virtuales.
    - Separación de correo de acceso vs. correo de notificaciones.
2.  **Gestión de Equipo (Usuarios):**
    - Roles estrictos: _Gerente, Contador, Auxiliar, Asistente, Ingeniero, Practicante_.
    - Paginación del lado del cliente (Client-Side) y búsqueda en tiempo real.
    - Borrado lógico (Soft Delete) cambiando estado a `INACTIVO`.
3.  **Directorio de Clientes:**
    - Cálculo automático de Dígito de Verificación (DV).
    - Asignación de responsables activos.
    - Paginación y ordenamiento alfabético automático (A-Z).
    - Gestión de obligaciones fiscales por cliente.
4.  **Calendario y Vencimientos:**
    - Calendario Base parametrizable por administradores.
    - Filtrado inteligente (Excluye tareas de clientes inactivos).
    - Auditoría de cambios de estado.
5.  **Perfil de Usuario:**
    - Configuración voluntaria de canal de notificaciones.
    - Actualización segura de contraseña.

---

## 🛠️ Arquitectura y Buenas Prácticas

- **Responsabilidad Única (SRP):** Los componentes de UI están separados de la lógica de negocio (`xxxService.ts`).
- **Validaciones Inmediatas:** Implementadas a nivel de esquema (Zod) previniendo peticiones innecesarias al servidor.
- **Soft Deletes:** Ningún registro de usuario o cliente se elimina físicamente para preservar la integridad de la auditoría y los historiales.
- **Client-Side Pagination:** Tablas optimizadas para calcular la paginación y el filtrado en memoria sin saturar la red con consultas constantes.

---

## ⚙️ Instalación y Desarrollo Local

### Pre-requisitos

- Node.js (v18 o superior recomendado)
- NPM o Yarn
- Proyecto configurado en Supabase

### Pasos

1. Clonar el repositorio.
2. Instalar las dependencias:
   ```bash
   npm install
   ```
3. Configurar las variables de entorno:
   - Duplicar el archivo `.env.example` (si existe) o crear un `.env`.
   - Agregar las credenciales de Supabase:
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. El proyecto se abrirá habitualmente en `http://localhost:5173`.

## 📜 Scripts Disponibles

- `npm run dev`: Inicia el entorno de desarrollo.
- `npm run build`: Compila el proyecto para producción de manera optimizada.
- `npm run lint`: Ejecuta ESLint para buscar problemas en el código.
- `npm run preview`: Levanta un servidor local para probar la versión de producción compilada.

---

## 👨‍💻 Autoría y Desarrollo

- **Desarrollado por:** Tecnoingeniería B.O.
- **Ingeniero Encargado:** Bernardo Andres Otero Jimenez

---

_Proyecto desarrollado por Tecnoingeniería B.O. siguiendo altos estándares de escalabilidad, rendimiento y principios SOLID._
