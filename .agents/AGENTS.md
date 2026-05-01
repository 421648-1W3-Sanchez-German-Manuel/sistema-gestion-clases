# Descripción del Proyecto para Agentes de IA

## Contexto

Este es un **Sistema de Gestión de Clases** completo, desarrollado para personal interno de una institución educativa. El sistema permite gestionar clases, profesores, alumnos, salones, horarios, asistencia y facturación.

## Stack Tecnológico

- **Backend**: FastAPI (Python) + MongoDB
- **Frontend**: React + TailwindCSS + shadcn/ui
- **Autenticación**: JWT almacenado en cookies HttpOnly
- **Base de datos**: MongoDB (motor/pymongo async)

## Arquitectura

### Backend
- `server.py` - Archivo principal con todos los endpoints REST
- `models.py` - Modelos Pydantic para validación de datos (InDB, Create, Update, Out)
- `auth.py` - Sistema de autenticación JWT con cookies HttpOnly
- `serializers.py` - Helpers para serializar documentos MongoDB a JSON

### Frontend
- `api/client.js` - Capa de API con Axios (withCredentials: true)
- `context/AuthContext.js` - Contexto de autenticación y roles
- `components/layout/SidebarLayout.jsx` - Layout principal con sidebar y topbar
- `pages/*` - Páginas de la aplicación (una por módulo)

## Roles del Sistema

### SUPERUSER
- Acceso total al sistema
- Puede: crear/editar/eliminar clases, profesores, tipos de clase, salones, horarios, usuarios
- Puede: todas las acciones de ADMIN

### ADMIN
- Acceso limitado
- Puede: gestionar alumnos, inscripciones, asistencia, facturación
- No puede: crear clases, gestionar salones/horarios, gestionar usuarios

## Colecciones MongoDB

| Colección | Descripción |
|---|---|
| `users` | Usuarios internos del sistema |
| `teachers` | Profesores (no acceden al sistema) |
| `class_types` | Categorías de clases |
| `classes` | Clases con tipo, profesor, límite de alumnos |
| `classrooms` | Salones físicos |
| `classroom_schedules` | Programación: qué clase, en qué salón, qué día/hora |
| `students` | Alumnos |
| `class_enrollments` | Inscripciones alumno-clase |
| `attendance` | Registros de asistencia por sesión |
| `billing` | Facturas de alumnos |

## Reglas de Negocio Críticas

1. **Conflicto de horario**: Validar que un salón no tenga dos clases simultáneas
2. **Límite de cupos**: `max_students` en cada clase debe respetarse al inscribir
3. **Soft delete**: `active = false`, nunca borrado físico
4. **Asistencia validada**: Solo alumnos inscriptos y activos
5. **Overdue automático**: Facturas con `due_date < hoy` y `status = PENDING` → `OVERDUE`

## Endpoints API

### Auth
- `POST /api/auth/login` - Login (setea cookie HttpOnly)
- `POST /api/auth/logout` - Logout (limpia cookie)
- `GET /api/auth/me` - Info del usuario autenticado

### CRUD por Recurso
Todos los endpoints siguen el patrón: `GET (list)`, `POST (create)`, `PUT /{id} (update)`, `DELETE /{id} (soft delete)`

- `/api/users` (solo SUPERUSER)
- `/api/teachers`
- `/api/class-types`
- `/api/classes` + `/api/classes/upcoming` + `/api/classes/{id}/students`
- `/api/classrooms` + `/api/classrooms/{id}/schedules`
- `/api/students` + `/api/students/{id}/enroll` + `/api/students/{id}/attendance` + `/api/students/{id}/billing`
- `/api/attendance/schedule/{scheduleId}` (GET para grilla, POST para bulk save)
- `/api/billing` + `/api/billing/mark-overdue`
- `/api/dashboard`

## Seed Inicial

- Email: `admin@sistema.com`
- Password: `Admin1234!`
- Rol: SUPERUSER

## Comandos

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend && yarn install && yarn start
```

## UI

- Interfaz completamente en **español**
- Dashboard con KPIs y clases del día
- Sidebar con navegación por módulos
- Responsive desde 768px
- Componentes shadcn/ui con data-testid para testing
- Toast notifications (sonner) para feedback
- Loading states (skeleton) en operaciones async
- Confirmación (AlertDialog) para eliminaciones

## Skills Instalados

Skills que mejoran la calidad del código y siguen best practices para este stack:

### Backend (FastAPI + Python + MongoDB)

| Skill | Installs | Descripción |
|-------|----------|-------------|
| [fastapi-python](https://skills.sh/mindrally/skills/fastapi-python) | 8K | FastAPI development best practices |
| [python-project-structure](https://skills.sh/wshobson/agents/python-project-structure) | 6.6K | Python project structure and architecture |
| [mongodb](https://skills.sh/hoodini/ai-agents-skills/mongodb) | 1.2K | MongoDB async patterns and best practices |

### Frontend (React + TailwindCSS + shadcn/ui)

| Skill | Installs | Descripción |
|-------|----------|-------------|
| [vercel-react-best-practices](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices) | 363K | React best practices from Vercel Engineering |
| [frontend-design](https://skills.sh/anthropics/skills/frontend-design) | 357K | Frontend design guidelines from Anthropic |
| [web-design-guidelines](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines) | 289K | Web design best practices |
| [shadcn](https://skills.sh/shadcn/ui/shadcn) | 119K | shadcn/ui component guidelines |

### Security

| Skill | Installs | Descripción |
|-------|----------|-------------|
| [security-best-practices](https://skills.sh/openai/skills/security-best-practices) | 2.1K | Security best practices (JWT, auth, data protection) |

### Workflow & Code Quality

| Skill | Installs | Descripción |
|-------|----------|-------------|
| [test-driven-development](https://skills.sh/obra/superpowers/test-driven-development) | 67K | TDD practices for reliable code |
| [verification-before-completion](https://skills.sh/obra/superpowers/verification-before-completion) | 55K | Verify work before marking complete |
