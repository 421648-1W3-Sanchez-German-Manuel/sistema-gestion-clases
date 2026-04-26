# plan.md — Sistema de Gestión de Clases (FastAPI + MongoDB + React)

## 1) Objectives
- Entregar un MVP web responsive (>=768px) en **español** para personal interno con roles **ADMIN** y **SUPERUSER**.
- Implementar el flujo core: **crear clase + crear salón + programar schedule sin conflictos + inscribir alumno con límite + tomar asistencia por sesión + generar/gestionar facturación**.
- Backend FastAPI con MongoDB: API REST, reglas de negocio, soft delete, paginación, UTC.
- Frontend React + Tailwind + shadcn/ui: sidebar, CRUD principales, estados de carga, validación y toasts.
- Repo público GitHub `sistema-gestion-clases` con README y `.agents/agents.md`.

---

## 2) Implementation Steps (Phases)

### Phase 1 — POC del core (aislado, sin UI completa)
**Meta:** probar que las reglas críticas funcionan en backend antes de construir la app.

**User stories (POC)**
1. Como SUPERUSER, quiero autenticarme y obtener mi perfil (/me) para validar permisos.
2. Como SUPERUSER, quiero crear un salón y programar una clase sin doble reserva para evitar conflictos.
3. Como ADMIN, quiero inscribir alumnos respetando `max_students` para no sobrepasar cupos.
4. Como ADMIN, quiero registrar asistencia solo para alumnos inscriptos/activos para asegurar integridad.
5. Como ADMIN, quiero crear una factura y que se marque OVERDUE si vence para mantener el estado al día.

**Steps**
- Definir modelos/colecciones MongoDB (users, classes, classrooms, schedules, students, enrollments, attendance, billing) con `active` y timestamps UTC.
- Implementar auth JWT (cookie HttpOnly) + dependencias de rol (ADMIN/SUPERUSER).
- Implementar endpoints mínimos para core flow (auth/me, classrooms+schedules, classes, students+enroll, attendance, billing).
- Implementar reglas de negocio:
  - Conflicto de horarios (mismo classroom+date con overlap start/end)
  - Límite de cupos por clase
  - Asistencia solo para inscriptos activos
  - Soft delete
  - Upcoming classes basado en schedules futuros
  - Tarea/simulador para marcar OVERDUE (endpoint interno o job simple inicial)
- **Script de prueba** `backend/scripts/poc_core_flow.py`:
  - login → crear teacher/type/class/classroom → crear schedule → intentar schedule conflict (debe fallar) → crear students → enroll hasta límite (último debe fallar) → registrar asistencia (y probar un alumno no inscripto: debe fallar) → crear billing y forzar overdue.
- Ajustar hasta que el script sea 100% verde.

**Exit:** script POC pasa consistentemente.

---

### Phase 2 — V1 App Development (UI + API completa MVP)
**User stories (V1)**
1. Como usuario, quiero iniciar/cerrar sesión y ver mi rol para saber qué acciones tengo disponibles.
2. Como SUPERUSER, quiero gestionar clases (crear/editar/baja lógica) para mantener la oferta actualizada.
3. Como SUPERUSER, quiero ver schedules por salón y crear/editar/eliminar con detección de conflictos para evitar dobles reservas.
4. Como ADMIN, quiero gestionar alumnos e inscribir/desinscribir fácilmente para operar el día a día.
5. Como ADMIN, quiero tomar asistencia por sesión en una grilla y guardar en bulk para hacerlo rápido.
6. Como ADMIN, quiero ver y modificar facturación con filtros por estado para controlar pagos.

**Backend (FastAPI)**
- Estructurar backend por módulos: `auth, users, teachers, class_types, classes, classrooms, students, attendance, billing`.
- Completar endpoints requeridos (CRUD + list con paginación y filtros básicos).
- Seed inicial: crear SUPERUSER `admin@sistema.com / Admin1234!` si no existe.
- Normalizar respuestas y errores (códigos + mensajes en español).
- Documentación OpenAPI (tags y schemas) y CORS con credenciales.

**Frontend (React + Tailwind + shadcn/ui)**
- Layout: sidebar fija + contenido; rutas protegidas; ocultar acciones por rol.
- Pantallas MVP:
  - Login
  - Dashboard (cards + próximas clases hoy/mañana)
  - Clases (tabla + filtros + modal CRUD; detalle con alumnos)
  - Salones (tabla + detalle con schedules por fecha + alta/edición)
  - Alumnos (tabla + búsqueda; detalle con tabs: info/clases/asistencia/facturación)
  - Asistencia (Clase → Schedule → grilla alumnos + notas + guardar)
  - Facturación (tabla + filtros por status + CRUD; cancel = CANCELLED)
- UX: loading states, toasts (sonner), formularios con RHF+Zod.

**Testing (end-to-end)**
- Ejecutar 1 ronda E2E manual guiada: login → CRUD básico → schedule conflict → enrollment límite → asistencia → billing.
- Corregir bugs críticos antes de pasar de fase.

---

### Phase 3 — Hardening + Features de producción (sin expandir scope)
**User stories (Hardening)**
1. Como SUPERUSER, quiero gestionar usuarios internos para controlar accesos.
2. Como usuario, quiero paginación y búsqueda consistentes en todas las tablas para encontrar datos rápido.
3. Como ADMIN, quiero ver historial de asistencia por alumno para seguimiento.
4. Como ADMIN, quiero ver facturación por alumno y por estado para conciliación.
5. Como sistema, quiero marcar automáticamente facturas vencidas para mantener estados correctos.

**Steps**
- Implementar gestión de usuarios (solo SUPERUSER) + baja lógica.
- Agregar filtros/paginación/orden en listados clave.
- Scheduled task real (APS chedule / simple background loop) o endpoint admin para correr “mark overdue” + tests.
- Mejorar validaciones y consistencia (timezone UTC, parseo de fechas/horas).
- Refactor hacia código modular y reusable (DTOs, services, repos).
- 1 ronda E2E + regresión de flujos core.

---

### Phase 4 — Repo público + documentación + estabilización
**User stories (Entrega)**
1. Como dev, quiero un README claro para levantar backend/frontend rápidamente.
2. Como dev, quiero variables de entorno documentadas para desplegar sin adivinar.
3. Como usuario interno, quiero mensajes de error claros para saber cómo corregir datos.
4. Como auditor interno, quiero soft delete consistente para conservar historial.
5. Como equipo, quiero una estructura de repo limpia para mantener el proyecto.

**Steps**
- Crear repo público GitHub `sistema-gestion-clases` bajo `421648-1W3-Sanchez-German-Manuel`.
- Agregar README raíz + README por `backend/` y `frontend/`.
- Crear `.agents/agents.md` con: contexto, comandos, convenciones, endpoints, seed.
- Tag `v1.0.0` cuando pase E2E.

---

## 3) Next Actions (immediate)
1. Implementar modelos Mongo + seed SUPERUSER.
2. Implementar auth JWT cookie + /auth/login, /auth/logout, /auth/me.
3. Implementar POC endpoints mínimos (schedules/enroll/attendance/billing) + script `poc_core_flow.py`.
4. Ejecutar POC hasta verde.
5. Construir UI V1 con rutas protegidas + sidebar + 2-3 pantallas iniciales (Login/Dashboard/Clases) y luego el resto.

---

## 4) Success Criteria
- POC: script core flow pasa (conflictos, cupos, asistencia válida, overdue) sin fallos.
- V1: usuario puede completar end-to-end: login → crear entidades → programar → inscribir → asistencia → facturación.
- Permisos: ADMIN no puede ver/ejecutar acciones SUPERUSER (en UI y API).
- Soft delete aplicado (no borrado físico) y listados filtran `active=true` por defecto.
- Repo público creado con documentación y seed funcionando (`admin@sistema.com / Admin1234!`).
