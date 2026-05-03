# Feature: Carga de alumnos por Excel y endpoint abierto

## 1. Carga masiva de alumnos mediante archivo Excel

### Backend — FastAPI

Nuevo endpoint que recibe un archivo `.xlsx` o `.xls`, parsea las filas
y crea los alumnos en la base de datos.

```
POST /api/students/import/excel    # [ADMIN, SUPERUSER]
Content-Type: multipart/form-data
Body: file (UploadFile)
```

**Dependencias a agregar:**
```
openpyxl
```

**Columnas esperadas en el Excel (fila 1 = encabezados):**

| Columna | Tipo | Obligatorio |
|---|---|---|
| `name` | string | ✅ |
| `email` | string | ❌ |
| `phone` | string | ❌ |
| `birth_date` | date (YYYY-MM-DD) | ❌ |
| `course_id` | string (ObjectId) | ❌ |

**Lógica del servicio:**
1. Leer el archivo con `openpyxl`.
2. Validar que existan las columnas mínimas requeridas.
3. Por cada fila, validar que `name` no esté vacío.
4. Si `course_id` está presente, verificar que el curso exista y esté activo,
   y que no supere `max_students`.
5. Insertar los alumnos válidos y acumular los errores de filas inválidas.
6. Devolver un resumen de la operación.

**Response:**
```json
{
  "created": 18,
  "failed": 2,
  "errors": [
    { "row": 4, "reason": "name es obligatorio" },
    { "row": 9, "reason": "course_id no existe o está inactivo" }
  ]
}
```

> La importación no es transaccional: los alumnos válidos se insertan aunque
> haya filas con error. Los errores se reportan al final para que el usuario
> pueda corregirlos y volver a subir solo las filas fallidas.

---

## 2. Endpoint abierto para integración con sistemas externos

Endpoint público (sin autenticación) que permite que otros backends creen
alumnos en el sistema mediante una petición HTTP.

```
POST /api/external/students
Content-Type: application/json
```

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "birth_date": "YYYY-MM-DD",
  "course_id": "string"
}
```

**Response exitoso:**
```json
{
  "id": "ObjectId generado",
  "name": "string",
  "created_at": "datetime"
}
```

**Consideraciones de seguridad:**
- Agregar un header de autenticación por **API key estática** configurable
  desde variable de entorno (`EXTERNAL_API_KEY`), para que no sea
  completamente abierto pero sí simple de consumir desde otro sistema.
- El header esperado es `X-API-Key: <valor>`.
- Si la key no coincide, responder `401 Unauthorized`.
- Este endpoint no requiere JWT ni sesión de usuario.
- Dejar la validación de `course_id` como opcional: si no se envía, el alumno
  se crea sin curso asignado.

**Configuración en `main.py`:**
```python
# Excluir este endpoint del middleware de autenticación JWT
app.include_router(external_router, prefix="/api/external", tags=["external"])
```

---

## Frontend

### Sección Alumnos — nueva acción "Importar desde Excel"

- Botón "Importar Excel" junto al botón "Nuevo alumno" (disponible para
  ADMIN y SUPERUSER).
- Al hacer clic, abrir un modal con:
  - Input de tipo `file` que acepte `.xlsx` y `.xls`.
  - Botón "Subir".
- Una vez procesado, mostrar el resumen de la operación:
  - ✅ `{n} alumnos creados correctamente.`
  - ⚠️ `{n} filas con error.` + tabla con número de fila y motivo del error.
- Opción de descargar una plantilla Excel con los encabezados correctos para
  facilitar la carga.

### Plantilla descargable

Agregar un botón "Descargar plantilla" que genere y descargue un `.xlsx`
con los encabezados en la fila 1:

```
name | email | phone | birth_date | course_id
```

Esto puede generarse en el frontend con la librería `xlsx` (SheetJS) sin
necesidad de un endpoint adicional.
