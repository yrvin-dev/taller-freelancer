# 01 · Requerimientos — Taller Freelancer

> Spec de negocio. Fuente de verdad de QUÉ se construye y PARA QUIÉN.
> Proyecto: `proyecto_dashboard_adminProyectos`. Autor: Yrvin Arana V.
> ⚠️ Documento generado como borrador a partir del proyecto. Revisar los puntos marcados con 🔶.

---

## 1. Objetivo de negocio
- **Qué es:** una aplicación web multiusuario para que cualquier freelancer administre de forma
  ordenada sus proyectos. Cada usuario entra con su cuenta de Google y ve solo sus datos.
- **Problema que resuelve:** hoy la información de cada proyecto (cliente, stack, accesos, enlaces,
  estado) está dispersa. El dashboard la centraliza en un solo lugar.
- **Métrica de éxito:** poder ver de un vistazo el estado de todos los proyectos y encontrar
  cualquier dato o acceso de un proyecto en menos de 10 segundos, sin buscar en notas sueltas.

## 2. Usuario
- **Muchos usuarios:** freelancers que se registran solos con **Google**. Cada cuenta es un espacio
  aislado (autorización por dueño, RLS). **Sin roles** en el MVP. Login obligatorio porque se guardan
  accesos y datos sensibles de clientes.

## 3. Modelo de datos (el corazón del dashboard)
Regla base: **un proyecto = un cliente** (no hay módulo de clientes aparte).

**Entidad `Proyecto`:**
- Nombre del proyecto / cliente
- Tipo (landing, e-commerce, dashboard, institucional…)
- Estado: `En desarrollo` · `Revisión` · `Producción` · `Mantenimiento` · `Archivado`
- Fecha de inicio y fecha objetivo / entrega
- Stack usado (texto o etiquetas)
- **Enlaces:** repo (GitHub), deploy (Vercel), diseño (Claude Design), CMS
- **Accesos / credenciales** del proyecto (CMS, hosting, dominio) 🔶 campo sensible — ver punto 7
- Monto / presupuesto en soles (PEN) + pagos parciales
- Vencimientos de dominio y hosting
- Miniatura (captura del sitio, 16:10)
- Bitácora: entradas Pedido / Cambio / Nota (con borrado)
- (Opcional) checklist de tandas / avance del `04-plan.md` de ese proyecto

## 4. Funcionalidad (qué hace)
- **CRUD de proyectos:** crear, ver, editar, eliminar.
- **Vista lista / tablero:** todos los proyectos con su estado, filtrable por estado y tipo.
  Tarjetas + tabla con switch; Kanban en fase 2.
- **Vista detalle:** toda la ficha de un proyecto en una página.
- **Búsqueda** por nombre de proyecto/cliente.
- **Panel resumen (home):** contadores por estado (ej. 3 en desarrollo, 2 en producción) y
  próximos vencimientos.
- 🔶 Deseables a futuro (fuera del MVP salvo que digas lo contrario): adjuntar archivos, línea de
  tiempo, recordatorios.

## 5. Sitemap (páginas)
1. **Login**
2. **Dashboard / Home** — resumen + contadores + accesos rápidos
3. **Proyectos** — lista/tablero con filtros
4. **Detalle de proyecto** — ficha completa + editar
5. **Nuevo / Editar proyecto** — formulario
6. **Calendario** — entregas y vencimientos
7. **Cuenta** — perfil de Google, preferencias, exportar datos, borrar cuenta
8. **Pantallas de estado** — sesión expirada (401) y sin acceso (403)

## 6. Stack (decidido — ver 03-arquitectura.md)
- **Next.js 15 + TypeScript + Tailwind 3.4 + Supabase (Auth Google + Postgres + RLS)**, deploy en Vercel con GitHub Actions.

### Opciones evaluadas (histórico)
- **Frontend:** Astro + islas React (`client:*`) + Tailwind CSS v3.4 (tokens del design system).
- **Backend / datos:** 🔶 **decisión clave.** Un dashboard con login y datos persistentes necesita
  backend. Dos caminos:
  - **A) Tu stack conocido:** Spring Boot + MySQL (API REST). Más control, más trabajo, refuerza
    tu perfil full-stack Java.
  - **B) Backend-as-a-service:** Supabase (Postgres + Auth + API listos). Mucho más rápido para un
    MVP personal; menos código de backend.
  - *Recomendación para herramienta personal:* empezar con **B (Supabase)** para tenerlo funcionando
    rápido; migrar a A si algún día lo conviertes en producto.
- **Deploy:** Vercel (frontend) con CI/CD. (Backend: según A/B.)

## 7. Seguridad (importante por los accesos)
- Login obligatorio. Nada del dashboard es público.
- Las credenciales de clientes se guardan en la base de datos, **nunca** en el repositorio.
- Secretos y keys del propio dashboard → `.env` dentro de `.gitignore`, nunca a git.
- Credenciales cifradas en el MVP (AES-256-GCM en servidor, clave en variable de entorno).

## 8. Integraciones
- Enlaces externos a GitHub, Vercel, Claude Design y CMS de cada proyecto (solo links, no API).
- 🔶 ¿Alguna integración activa (ej. traer el estado del deploy desde Vercel)? Por defecto: no, solo links.

## 9. Alcance del MVP
**Entra:** login, CRUD de proyectos, lista/tablero con filtros, detalle, home con resumen, búsqueda.
**Entra también:** multiusuario con Google, pagos, vencimientos, bitácora, calendario, cuenta, 401/403.
**Fuera de alcance (v1):** roles/equipos, Kanban, adjuntos, recordatorios/notificaciones, integraciones por API,
reportes/facturación.

## 10. Plazos
- 🔶 Sin fecha definida (proyecto propio). Sugerido: MVP usable en 4–6 tandas de trabajo.
