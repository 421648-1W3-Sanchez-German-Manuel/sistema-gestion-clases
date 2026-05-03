# Feature: Datos de tutor para alumnos menores de edad

## Descripción

Si un alumno es menor de edad (menos de 18 años al momento del registro o
edición), el sistema debe permitir registrar opcionalmente el nombre completo
y teléfono de contacto de un tutor responsable.

---

## Backend — FastAPI

### Modelo `students` — campo a agregar

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "phone": "string",
  "birth_date": "date",
  "guardian": {
    "name": "string",
    "phone": "string"
  },
  "course_id": "ObjectId -> courses",
  "active": "bool",
  "created_at": "datetime"
}
```

> `guardian` es un subdocumento embebido. Si el alumno es mayor de edad o no
> se provee, se almacena como `null`.

### Schema Pydantic

```python
from pydantic import BaseModel
from typing import Optional
from datetime import date

class GuardianSchema(BaseModel):
    name: str
    phone: str

class StudentCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    course_id: Optional[str] = None
    guardian: Optional[GuardianSchema] = None
```

### Lógica de validación en el servicio

```python
from datetime import date

def is_minor(birth_date: date) -> bool:
    today = date.today()
    age = today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )
    return age < 18
```

- Si `birth_date` está presente y el alumno **es mayor de edad**, ignorar el
  campo `guardian` aunque venga en el body (no guardarlo).
- Si `birth_date` está presente y el alumno **es menor de edad**, guardar
  `guardian` si fue provisto, o `null` si no (es opcional).
- Si `birth_date` no está presente, guardar `guardian` si fue provisto
  (no se puede calcular edad).

---

## Frontend

### Formulario de creación y edición de alumno

- Mostrar el bloque de tutor de forma **condicional**:
  - Si `birth_date` está completado y la edad calculada es menor a 18 años,
    mostrar la sección "Datos del tutor (opcional)".
  - Si el alumno es mayor de edad, ocultar la sección completamente.
  - Si `birth_date` no está completado, no mostrar la sección.

- La sección de tutor contiene dos campos:
  - Nombre completo del tutor.
  - Teléfono de contacto del tutor.

- Ambos campos son **opcionales** incluso si el alumno es menor de edad.
  El formulario no debe bloquear el guardado si están vacíos.

### Vista detalle del alumno

- Si el alumno tiene `guardian` cargado, mostrar una sección "Tutor
  responsable" con nombre y teléfono.
- Si `guardian` es `null`, no mostrar la sección.

### Cálculo de edad en el frontend

```typescript
function isMinor(birthDate: string): boolean {
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  const adjustedAge =
    monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  return adjustedAge < 18;
}
```

### Tipos TypeScript actualizados

```typescript
interface Guardian {
  name: string;
  phone: string;
}

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  guardian?: Guardian | null;
  course_id?: string;
  active: boolean;
  created_at: string;
}
```
