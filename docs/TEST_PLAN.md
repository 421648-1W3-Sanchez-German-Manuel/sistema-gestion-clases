# Testing Plan

Overview
- Backend: FastAPI/Pydantic models and endpoints
- Frontend: React UI with existing components

Goals
- Verify that backend models reflect Correcciones.md (no teacher_id/class_type_id on Course; Schedule day_of_week removed; Classroom fields capacity/location removed).
- Validate that frontend UI no longer renders class_type_name/teacher_name in relevant pages (Cursos, CursoDetail).
- Ensure encoding requirements (UTF-8, non-ASCII characters in JSON) are satisfied by default.

How to run tests
- Backend tests (pytest)
  - Ensure dependencies installed (e.g. python3 -m venv .venv; source .venv/bin/activate; pip install -r requirements.txt if provided, otherwise install pytest and pydantic).
  - Run: pytest backend/tests/test_models.py -q
- Frontend tests (npm)
  - In frontend directory: npm test --silent

Test coverage outline
- Backend
  - test_models.py ensures CourseInDB and ClassroomInDB shapes align with Correcciones.md.
- Frontend
  - Ensure CursosPage UI no longer shows Tipo/Profesor columns and only shows Nombre, Horario, Inicio, Alumnos, Acciones.
  - Ensure CursoDetailPage shows schedule as time range without day_of_week and description neutralized.
  - Ensure SalonesPage shows Nombre only in list and in modal, and Create/Update payloads are { name }.

Notes
- The repo currently uses a frontend test script; ensure dependencies for tests exist in your CI/CD environment.
- If tests fail due to environment, adjust the test runner or install steps accordingly.
