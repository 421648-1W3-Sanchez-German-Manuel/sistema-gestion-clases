# Feature: Rediseño del modelo de datos — Cursos y Clases

## Contexto y motivación

El modelo anterior no representaba correctamente la realidad del negocio.
Se reemplaza el concepto de "clase con alumnos individuales" por dos entidades
diferenciadas:

- **Curso:** agrupa a los alumnos bajo un horario fijo y recurrente. Los admins
  gestionan alumnos a nivel de curso, no de sesión individual.
- **Clase (sesión):** es el evento concreto que ocurre cada semana. Se crea
  manualmente por un admin/superuser. Puede tener un salón y horario distintos
  al del curso si es una sesión recuperada.

Esto elimina la necesidad de agregar alumnos clase por clase: al registrar
asistencia, el sistema toma los alumnos activos del curso asociado a esa clase.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Python + FastAPI |
| Base de datos | MongoDB |
| ODM | Motor (async) + Beanie |
| Autenticación | JWT en cookie HttpOnly |
| Front Web | React + Vite + TypeScript + TailwindCSS |

---

## Nuevo modelo de datos (MongoDB)

### Colección: `courses`

Representa un curso con horario fijo recurrente (siempre los sábados).

```json
{
  "_id": "ObjectId",
  "name": "string",
  "teacher_id": "ObjectId -> teachers",
  "class_type_id": "ObjectId -> class_types",
  "schedule": {
    "day_of_week": "string",       // Ej: "saturday"
    "start_time": "string",        // Ej: "10:00"
    "end_time": "string"           // Ej: "12:00"
  },
  "start_month": "string",         // Ej: "2025-03" (YYYY-MM)
  "max_students": "int",
  "active": "bool",
  "created_at": "datetime"
}
```

### Colección: `classes` (sesiones)

Cada instancia concreta de una clase. Creada manualmente por admin/superuser.

```json
{
  "_id": "ObjectId",
  "course_id": "ObjectId -> courses",
  "date": "date",                  // Fecha exacta de la sesión
  "start_time": "string",          // Puede diferir del horario del curso
  "end_time": "string",
  "classroom_id": "ObjectId -> classrooms",
  "recovered": "bool",             // true si es una sesión recuperada
  "active": "bool",
  "created_at": "datetime"
}
```

> **Regla de negocio:** si `recovered = false`, no se valida conflicto de
> horario con otras clases del mismo curso. Si `recovered = true`, el sistema
> igual permite cualquier horario, pero puede mostrar un aviso visual en el
> frontend si hay superposición con otra sesión del mismo salón.

### Colección: `students`

Un alumno pertenece a un único curso en un momento dado. Al cambiar de curso,
se pisa `course_id` sin guardar historial. Las asistencias pasadas quedan
ligadas a las sesiones anteriores y no se modifican.

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "phone": "string",
  "birth_date": "date",
  "course_id": "ObjectId -> courses",   // Curso actual
  "active": "bool",
  "created_at": "datetime"
}
```

### Colección: `attendance`

Registrada por sesión (`class_id`). Al momento de tomarla, se resuelven los
alumnos activos del curso asociado a esa clase.

```json
{
  "_id": "ObjectId",
  "class_id": "ObjectId -> classes",
  "student_id": "ObjectId -> students",
  "present": "bool",
  "notes": "string",
  "recorded_at": "datetime"
}
```

### Colección: `billing` (sin cambios)

```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId -> students",
  "amount": "float",
  "due_date": "date",
  "paid_date": "date | null",
  "status": "PENDING | PAID | OVERDUE | CANCELLED",
  "description": "string",
  "created_at": "datetime"
}
```

### Colecciones auxiliares (sin cambios relevantes)

- `teachers`: `{ name, email, phone, active }`
- `classrooms`: `{ name, capacity, location, active }`
- `class_types`: `{ name, description }`
- `users`: `{ name, email, password_hash, role: ADMIN|SUPERUSER, active }`

---

## Backend — FastAPI

### Estructura de carpetas

```
app/
├── core/
│   ├── config.py          # Variables de entorno
│   ├── security.py        # JWT, cookie utils
│   └── database.py        # Conexión MongoDB / Beanie init
├── models/                # Documentos Beanie (ODM)
│   ├── course.py
│   ├── class_session.py
│   ├── student.py
│   ├── attendance.py
│   ├── billing.py
│   ├── teacher.py
│   ├── classroom.py
│   └── user.py
├── schemas/               # Pydantic schemas (Request/Response)
│   ├── course.py
│   ├── class_session.py
│   ├── student.py
│   ├── attendance.py
│   └── billing.py
├── routers/               # Un router por entidad
│   ├── auth.py
│   ├── courses.py
│   ├── classes.py
│   ├── students.py
│   ├── attendance.py
│   ├── billing.py
│   ├── classrooms.py
│   └── teachers.py
├── services/              # Lógica de negocio desacoplada
│   ├── course_service.py
│   ├── class_service.py
│   ├── student_service.py
│   ├── attendance_service.py
│   └── billing_service.py
├── dependencies/
│   └── auth.py            # get_current_user, require_role
└── main.py
```

### Endpoints nuevos y modificados

#### Cursos (`/api/courses`)

```
GET    /api/courses                    # Listar cursos activos (paginado)
GET    /api/courses/{id}               # Detalle de un curso
GET    /api/courses/{id}/students      # Alumnos activos del curso
GET    /api/courses/{id}/classes       # Sesiones del curso
POST   /api/courses                    # Crear curso [SUPERUSER]
PUT    /api/courses/{id}               # Editar curso [SUPERUSER]
DELETE /api/courses/{id}               # Baja lógica [SUPERUSER]
```

**Body POST/PUT:**
```json
{
  "name": "string",
  "teacher_id": "string",
  "class_type_id": "string",
  "schedule": {
    "day_of_week": "saturday",
    "start_time": "10:00",
    "end_time": "12:00"
  },
  "start_month": "2025-03",
  "max_students": 20
}
```

#### Clases/Sesiones (`/api/classes`)

```
GET    /api/classes                    # Listar sesiones (filtros: course_id, date, recovered)
GET    /api/classes/upcoming           # Sesiones futuras ordenadas por fecha
GET    /api/classes/{id}               # Detalle de sesión
POST   /api/classes                    # Crear sesión manualmente [ADMIN, SUPERUSER]
PUT    /api/classes/{id}               # Editar sesión [SUPERUSER]
DELETE /api/classes/{id}               # Baja lógica [SUPERUSER]
```

**Body POST/PUT:**
```json
{
  "course_id": "string",
  "date": "2025-05-10",
  "start_time": "10:00",
  "end_time": "12:00",
  "classroom_id": "string",
  "recovered": false
}
```

**Reglas de negocio en el servicio:**
- Si `recovered = true`, no hay restricción de horario, pero se registra la
  flag para que el frontend la muestre visualmente.
- Si `recovered = false`, el sistema puede advertir (no bloquear) si hay otra
  sesión del mismo salón en la misma fecha y rango horario.

#### Alumnos (`/api/students`)

```
GET    /api/students                   # Listar (filtros: course_id, active, search)
GET    /api/students/{id}              # Detalle
GET    /api/students/{id}/attendance   # Historial de asistencia
GET    /api/students/{id}/billing      # Facturación del alumno
POST   /api/students                   # Crear alumno
PUT    /api/students/{id}              # Editar alumno (incluyendo cambio de curso)
DELETE /api/students/{id}              # Baja lógica
```

**Body PUT para cambio de curso:**
```json
{
  "course_id": "nuevo_course_id"
}
```

> Al cambiar `course_id`, no se modifica ni elimina ningún registro de
> `attendance` existente. Las asistencias pasadas conservan su `class_id`
> original, que a su vez apunta al curso anterior.

#### Asistencia (`/api/attendance`)

```
GET    /api/attendance/class/{class_id}         # Lista alumnos del curso + su estado para esa sesión
POST   /api/attendance/class/{class_id}         # Registrar/actualizar asistencia bulk
```

**Lógica de `GET /api/attendance/class/{class_id}`:**
1. Obtener la sesión por `class_id` → extraer `course_id`.
2. Obtener todos los alumnos activos con ese `course_id`.
3. Para cada alumno, buscar si ya existe un documento en `attendance` con ese
   `class_id` y `student_id`. Si existe, devolver su estado; si no, devolver
   `present: null` (aún no registrado).

**Body POST (bulk):**
```json
[
  { "student_id": "abc123", "present": true, "notes": "" },
  { "student_id": "def456", "present": false, "notes": "Avisó con anticipación" }
]
```

> Usar `upsert` en MongoDB: si ya existe un registro de asistencia para ese
> alumno en esa sesión, se actualiza; si no, se crea.

---

## Frontend Web — React + Vite

### Pantallas afectadas y cambios requeridos

#### Cursos (nueva sección, reemplaza a "Clases")

- Tabla de cursos activos con columnas: nombre, tipo, profesor, horario, mes
  de inicio, cantidad de alumnos / máximo.
- Botón "Nuevo curso" (solo SUPERUSER).
- Modal/drawer de creación y edición con campos:
  - Nombre, tipo de clase, profesor (selects).
  - Día de la semana (fijo: sábado, o configurable).
  - Horario inicio/fin (time pickers).
  - Mes de inicio (month picker: YYYY-MM).
  - Máximo de alumnos.
- Baja lógica con confirmación.
- **Vista detalle del curso:**
  - Información del curso.
  - Listado de alumnos inscriptos con opción de agregar/quitar alumno.
  - Listado de sesiones del curso con acceso rápido a la asistencia.

#### Clases/Sesiones (nueva sección)

- Lista de sesiones, filtrable por curso, fecha y flag `recovered`.
- Badge visual diferenciado para sesiones recuperadas (ej. color naranja +
  ícono).
- Botón "Nueva sesión" (ADMIN y SUPERUSER).
- Modal de creación con campos:
  - Curso (select).
  - Fecha (date picker).
  - Horario inicio/fin (puede diferir del curso; prellenar con el del curso
    como valor por defecto).
  - Salón (select).
  - Toggle "¿Es recuperada?".
- Edición y baja lógica de sesiones (solo SUPERUSER).
- Vista "Próximas clases": lista ordenada por fecha con salón, horario, curso y
  profesor.

#### Alumnos — cambios

- El formulario de creación/edición incluye un select de **Curso** (no de
  clase individual).
- Al editar un alumno, cambiar el curso muestra un aviso: *"El alumno
  mantendrá su historial de asistencia del curso anterior."*
- En la vista detalle del alumno, la sección de asistencia muestra el historial
  agrupado por curso, identificando visualmente las sesiones recuperadas.

#### Asistencia — cambios

- El flujo cambia de *Clase → Schedule → Alumnos* a *Sesión → Alumnos*:
  1. Seleccionar una sesión (con búsqueda por curso y fecha).
  2. El sistema carga automáticamente los alumnos activos del curso asociado.
  3. Grilla con toggle Presente/Ausente y campo de notas por alumno.
  4. Botón "Guardar asistencia" (upsert bulk).
- Si la sesión tiene `recovered = true`, mostrar un banner informativo:
  *"Esta es una clase recuperada."*

### Nuevos tipos TypeScript

```typescript
interface Schedule {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface Course {
  id: string;
  name: string;
  teacher_id: string;
  class_type_id: string;
  schedule: Schedule;
  start_month: string;       // "YYYY-MM"
  max_students: number;
  active: boolean;
  created_at: string;
}

interface ClassSession {
  id: string;
  course_id: string;
  date: string;              // "YYYY-MM-DD"
  start_time: string;
  end_time: string;
  classroom_id: string;
  recovered: boolean;
  active: boolean;
  created_at: string;
}

interface AttendanceRecord {
  student_id: string;
  student_name: string;
  present: boolean | null;   // null = aún no registrado
  notes: string;
}
```

---

## Reglas de negocio consolidadas

1. **Un alumno pertenece a un único curso.** Al cambiar de curso, se pisa
   `course_id` en el documento del alumno. No se guarda historial de cursos.

2. **Las asistencias son inmutables respecto al curso.** Al cambiar de curso,
   los registros de `attendance` pasados no se tocan; siguen apuntando a las
   sesiones del curso anterior.

3. **Las sesiones se crean manualmente** por admin o superuser cada semana.
   No se generan automáticamente.

4. **Una sesión recuperada** (`recovered = true`) puede tener cualquier fecha,
   horario y salón, independientemente del horario habitual del curso. No hay
   validación de conflicto que la bloquee.

5. **Al registrar asistencia**, los alumnos válidos para esa sesión son los
   que tienen `course_id` igual al `course_id` de la clase, y `active = true`,
   al momento de tomar la asistencia.

6. **El máximo de alumnos** (`max_students`) se valida al agregar un alumno a
   un curso: si el curso ya tiene ese número de alumnos activos, se rechaza la
   operación.

7. **Baja lógica universal:** ninguna entidad se elimina físicamente. Todas las
   queries filtran por `active = true` por defecto.

---

## Checklist de implementación

### Backend
- [ ] Redefinir modelos Beanie: `Course`, `ClassSession`, `Student`,
      `Attendance`, `Billing`
- [ ] Implementar `CourseService` con validación de `max_students`
- [ ] Implementar `ClassService` con lógica de flag `recovered`
- [ ] Implementar `AttendanceService` con resolución de alumnos por curso y
      upsert bulk
- [ ] Implementar `StudentService` con cambio de curso (sin historial)
- [ ] Actualizar todos los routers con los nuevos endpoints
- [ ] Agregar índices en MongoDB: `classes.course_id`, `classes.date`,
      `students.course_id`, `attendance.class_id + student_id` (único)

### Frontend
- [ ] Crear sección **Cursos** (CRUD completo + vista detalle)
- [ ] Crear sección **Sesiones/Clases** (CRUD + badge de recuperada)
- [ ] Actualizar sección **Alumnos**: select de curso en formulario + aviso al
      cambiar de curso
- [ ] Actualizar sección **Asistencia**: nuevo flujo simplificado
- [ ] Actualizar tipos TypeScript (`Course`, `ClassSession`,
      `AttendanceRecord`)
- [ ] Actualizar servicios de API (`courseApi`, `classApi`, `attendanceApi`)
