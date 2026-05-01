# Sistema de Gestión de Clases

## Descripción

Sistema de gestión integral para administrar clases, alumnos, profesores, salones, asistencia y facturación. Diseñado exclusivamente para personal interno (Administradores y Superusuarios). Los alumnos son gestionados por el personal y no tienen acceso al sistema.

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | FastAPI (Python) |
| Base de datos | MongoDB |
| Frontend Web | React + TailwindCSS + shadcn/ui |
| Autenticación | JWT (HttpOnly cookies) |

## Características Principales

### Gestión de Clases
- CRUD completo de clases con tipo, profesor asignado y límite de alumnos
- Vista de próximas clases programadas
- Detalle de clase con alumnos inscriptos

### Gestión de Salones y Horarios
- Administración de salones con capacidad y ubicación
- Programación de clases por salón, fecha y horario
- **Detección de conflictos de horario** (impide doble reserva)

### Gestión de Alumnos
- CRUD de alumnos con información de contacto
- Inscripción a clases con **validación de cupos máximos**
- Vista detallada: información, clases, asistencia, facturación

### Asistencia
- Registro por sesión (clase + horario específico)
- Toggle presente/ausente con notas
- Guardado masivo (bulk)
- Validación: solo alumnos inscriptos y activos

### Facturación
- CRUD de facturas por alumno
- Estados: Pendiente, Pagada, Vencida, Cancelada
- Marcado automático de facturas vencidas
- Filtros por estado

### Seguridad y Roles
- Autenticación JWT en cookies HttpOnly
- **SUPERUSER**: Acceso total (crear clases, salones, profesores, gestionar usuarios)
- **ADMIN**: Gestión de alumnos, inscripciones, asistencia y facturación
- Baja lógica (soft delete) en todas las entidades

## Modelo de Datos (MongoDB)

### Colecciones
- `users` - Usuarios del sistema (ADMIN / SUPERUSER)
- `teachers` - Profesores
- `class_types` - Tipos de clase
- `classes` - Clases
- `classrooms` - Salones
- `classroom_schedules` - Programación de clases
- `students` - Alumnos
- `class_enrollments` - Inscripciones
- `attendance` - Asistencia
- `billing` - Facturación

## API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |

### Recursos (CRUD)
| Recurso | Rutas base |
|---|---|
| Usuarios | `/api/users` (solo SUPERUSER) |
| Profesores | `/api/teachers` |
| Tipos de clase | `/api/class-types` |
| Clases | `/api/classes`, `/api/classes/upcoming` |
| Salones | `/api/classrooms` |
| Alumnos | `/api/students` |
| Asistencia | `/api/attendance/schedule/{id}` |
| Facturación | `/api/billing` |
| Dashboard | `/api/dashboard` |

## Instalación y Ejecución

### Backend
```bash
cd backend
pip install -r requirements.txt
# Configurar variables de entorno en .env
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=gestion_clases
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

### Variables de Entorno

**Backend (.env)**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=gestion_clases
CORS_ORIGINS=http://localhost:3000
```

**Frontend (.env)**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Usuario por defecto (Seed)
- **Email**: `admin@sistema.com`
- **Contraseña**: `Admin1234!`
- **Rol**: SUPERUSER

## Reglas de Negocio

1. **Conflicto de horario**: No se puede programar dos clases en el mismo salón, día y rango horario
2. **Límite de cupos**: No se puede inscribir alumnos si la clase alcanzó `max_students`
3. **Baja lógica**: Ninguna entidad se elimina físicamente (`active = false`)
4. **Asistencia válida**: Solo alumnos inscriptos y activos pueden tener asistencia
5. **Facturas vencidas**: Se marcan automáticamente como `OVERDUE` si la fecha de vencimiento es pasada

## Estructura del Proyecto

```
.
├── backend/
│   ├── server.py          # API principal FastAPI
│   ├── models.py          # Modelos Pydantic
│   ├── auth.py            # JWT + autenticación
│   ├── serializers.py     # Helpers de serialización
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # Capa API con Axios
│   │   ├── context/AuthContext.js  # Contexto de autenticación
│   │   ├── components/         # Componentes reutilizables
│   │   └── pages/              # Páginas de la aplicación
│   ├── package.json
│   └── .env
├── .agents/
│   └── agents.md           # Descripción para agentes IA
└── README.md
```

## Licencia

MIT
