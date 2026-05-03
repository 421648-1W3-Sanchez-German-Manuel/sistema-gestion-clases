# Correcciones al modelo existente

## 1. Cursos — eliminar campos `teacher_id`, `class_type_id` y `day_of_week`

El curso es únicamente un agrupador de alumnos con un horario en común.
El profesor y el tipo de clase pertenecen a la sesión, no al curso.

### Modelo `courses` — campos a eliminar
- `teacher_id`
- `class_type_id`
- `schedule.day_of_week`

### Modelo resultante
```json
{
  "_id": "ObjectId",
  "name": "string",
  "schedule": {
    "start_time": "string",
    "end_time": "string"
  },
  "start_month": "string",
  "max_students": "int",
  "active": "bool",
  "created_at": "datetime"
}
```

### Body POST/PUT `/api/courses`
```json
{
  "name": "string",
  "schedule": {
    "start_time": "10:00",
    "end_time": "12:00"
  },
  "start_month": "2025-03",
  "max_students": 20
}
```

### Interfaz TypeScript — `Course`
```typescript
interface Schedule {
  start_time: string;
  end_time: string;
}

interface Course {
  id: string;
  name: string;
  schedule: Schedule;
  start_month: string;
  max_students: number;
  active: boolean;
  created_at: string;
}
```

### Frontend — formulario de curso
Eliminar los campos: tipo de clase, profesor y día de la semana.
Dejar únicamente: nombre, horario inicio/fin, mes de inicio y máximo de alumnos.

---

## 2. Salones — eliminar campos `capacity` y `location`

El salón solo necesita nombre, id generado por MongoDB y estado activo.

### Modelo `classrooms` — campos a eliminar
- `capacity`
- `location`

### Modelo resultante
```json
{
  "_id": "ObjectId",
  "name": "string",
  "active": "bool"
}
```

### Body POST/PUT `/api/classrooms`
```json
{
  "name": "string"
}
```

### Frontend — formulario de salón
Eliminar los campos: capacidad y ubicación.
Dejar únicamente: nombre.

---

## 3. Cursos — el horario no incluye día de la semana

El campo `day_of_week` dentro de `schedule` debe eliminarse del modelo,
del schema de Pydantic, del body de la API y de la interfaz TypeScript.
El día concreto de cada clase lo define la sesión al crearse manualmente.
Ver punto 1 para el modelo y la interfaz actualizados.

---

## 4. Limpieza de escapes unicode

Reemplazar en todo el código (modelos, schemas, comentarios, strings) las
secuencias de escape unicode del estilo `\u00f3`, `\u00f3n`, etc. por los
caracteres UTF-8 correspondientes o por emojis donde aplique.

Ejemplos comunes:
| Escape | Caracter correcto |
|---|---|
| `\u00e1` | á |
| `\u00e9` | é |
| `\u00ed` | í |
| `\u00f3` | ó |
| `\u00fa` | ú |
| `\u00f1` | ñ |
| `\u00fc` | ü |

Asegurarse de que todos los archivos estén guardados con encoding **UTF-8**
y que el servidor FastAPI tenga configurado `ensure_ascii=False` en las
respuestas JSON:

```python
from fastapi.responses import JSONResponse

JSONResponse(content=data, media_type="application/json; charset=utf-8")
```

O a nivel global en la app:

```python
from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
import json

app = FastAPI()
app.json_encoder = lambda v: json.dumps(v, ensure_ascii=False)
```
