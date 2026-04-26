"""
POC Core Flow Test Script
Tests all critical business logic in isolation:
1. Auth (login, me, logout)
2. Teachers & Class Types CRUD
3. Classes CRUD
4. Classrooms + Scheduling with conflict detection
5. Students + Enrollment with max_students limit
6. Attendance with enrollment validation
7. Billing + overdue marking
"""
import requests
import sys

BASE = "http://localhost:8001/api"
SESSION = requests.Session()

PASS = 0
FAIL = 0

def test(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        print(f"  ❌ {name} → {detail}")


def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


# ─── 1. AUTH ───
section("1. AUTHENTICATION")

# Login with correct credentials
r = SESSION.post(f"{BASE}/auth/login", json={"email": "admin@sistema.com", "password": "Admin1234!"})
test("Login exitoso", r.status_code == 200, f"status={r.status_code}, body={r.text[:200]}")
if r.status_code == 200:
    user_data = r.json().get("user", {})
    test("Login devuelve rol SUPERUSER", user_data.get("role") == "SUPERUSER", f"role={user_data.get('role')}")

# Cookie should be set
test("Cookie session_token presente", "session_token" in SESSION.cookies.get_dict(), SESSION.cookies.get_dict())

# Get /me
r = SESSION.get(f"{BASE}/auth/me")
test("GET /auth/me exitoso", r.status_code == 200, r.text[:200])
if r.status_code == 200:
    test("/me devuelve email correcto", r.json().get("email") == "admin@sistema.com")

# Login with wrong password
r2 = requests.post(f"{BASE}/auth/login", json={"email": "admin@sistema.com", "password": "wrong"})
test("Login con password incorrecto → 401", r2.status_code == 401, f"status={r2.status_code}")


# ─── 2. TEACHERS ───
section("2. TEACHERS")

r = SESSION.post(f"{BASE}/teachers", json={"name": "Prof. García", "email": "garcia@test.com", "phone": "123456"})
test("Crear profesor", r.status_code == 200, r.text[:200])
teacher_id = r.json().get("id") if r.status_code == 200 else None

r = SESSION.get(f"{BASE}/teachers")
test("Listar profesores", r.status_code == 200 and len(r.json()) >= 1, r.text[:200])

if teacher_id:
    r = SESSION.put(f"{BASE}/teachers/{teacher_id}", json={"name": "Prof. García López"})
    test("Editar profesor", r.status_code == 200, r.text[:200])


# ─── 3. CLASS TYPES ───
section("3. CLASS TYPES")

r = SESSION.post(f"{BASE}/class-types", json={"name": "Yoga", "description": "Clases de yoga"})
test("Crear tipo de clase", r.status_code == 200, r.text[:200])
ct_id = r.json().get("id") if r.status_code == 200 else None

r = SESSION.get(f"{BASE}/class-types")
test("Listar tipos de clase", r.status_code == 200 and len(r.json()) >= 1, r.text[:200])


# ─── 4. CLASSES ───
section("4. CLASSES")

r = SESSION.post(f"{BASE}/classes", json={
    "name": "Yoga Matutino",
    "class_type_id": ct_id,
    "teacher_id": teacher_id,
    "max_students": 2,  # LOW LIMIT for testing
    "start_date": "2026-04-01",
    "end_date": "2026-12-31",
})
test("Crear clase (max_students=2)", r.status_code == 200, r.text[:300])
class_id = r.json().get("id") if r.status_code == 200 else None

r = SESSION.get(f"{BASE}/classes")
test("Listar clases activas", r.status_code == 200 and len(r.json()) >= 1, r.text[:200])

if class_id:
    r = SESSION.get(f"{BASE}/classes/{class_id}")
    test("Detalle de clase con enrichment", r.status_code == 200 and r.json().get("class_type_name") == "Yoga", r.text[:300])


# ─── 5. CLASSROOMS + SCHEDULING ───
section("5. CLASSROOMS + SCHEDULING (conflict detection)")

r = SESSION.post(f"{BASE}/classrooms", json={"name": "Salón A", "capacity": 30, "location": "Planta baja"})
test("Crear salón", r.status_code == 200, r.text[:200])
room_id = r.json().get("id") if r.status_code == 200 else None

# Create schedule
r = SESSION.post(f"{BASE}/classrooms/{room_id}/schedules", json={
    "class_id": class_id,
    "date": "2026-05-01",
    "start_time": "09:00",
    "end_time": "10:30",
})
test("Crear schedule", r.status_code == 200, r.text[:300])
schedule_id = r.json().get("id") if r.status_code == 200 else None

# Try CONFLICTING schedule (overlap: 10:00-11:00 overlaps with 09:00-10:30)
r = SESSION.post(f"{BASE}/classrooms/{room_id}/schedules", json={
    "class_id": class_id,
    "date": "2026-05-01",
    "start_time": "10:00",
    "end_time": "11:00",
})
test("Schedule con conflicto → 409", r.status_code == 409, f"status={r.status_code}, body={r.text[:200]}")

# Non-overlapping schedule should work
r = SESSION.post(f"{BASE}/classrooms/{room_id}/schedules", json={
    "class_id": class_id,
    "date": "2026-05-01",
    "start_time": "11:00",
    "end_time": "12:00",
})
test("Schedule sin conflicto → ok", r.status_code == 200, r.text[:200])

# Get schedules by date
r = SESSION.get(f"{BASE}/classrooms/{room_id}/schedules?date=2026-05-01")
test("Listar schedules por fecha", r.status_code == 200 and len(r.json()) == 2, f"count={len(r.json()) if r.status_code == 200 else 'err'}")

# Upcoming classes should include our class
r = SESSION.get(f"{BASE}/classes/upcoming")
test("Próximas clases incluye nuestra clase", r.status_code == 200 and len(r.json()) >= 1, r.text[:200])


# ─── 6. STUDENTS + ENROLLMENT ───
section("6. STUDENTS + ENROLLMENT (max_students limit)")

students = []
for i, name in enumerate(["Ana Torres", "Carlos Pérez", "Diana López"]):
    r = SESSION.post(f"{BASE}/students", json={"name": name, "email": f"student{i}@test.com"})
    test(f"Crear alumno: {name}", r.status_code == 200, r.text[:200])
    if r.status_code == 200:
        students.append(r.json()["id"])

# Enroll student 1
r = SESSION.post(f"{BASE}/students/{students[0]}/enroll", json={"class_id": class_id})
test("Inscribir alumno 1 (cupo 1/2)", r.status_code == 200, r.text[:200])

# Enroll student 2
r = SESSION.post(f"{BASE}/students/{students[1]}/enroll", json={"class_id": class_id})
test("Inscribir alumno 2 (cupo 2/2)", r.status_code == 200, r.text[:200])

# Enroll student 3 should FAIL (max=2)
r = SESSION.post(f"{BASE}/students/{students[2]}/enroll", json={"class_id": class_id})
test("Inscribir alumno 3 → FALLA (límite alcanzado)", r.status_code == 400, f"status={r.status_code}, body={r.text[:200]}")

# Try duplicate enrollment
r = SESSION.post(f"{BASE}/students/{students[0]}/enroll", json={"class_id": class_id})
test("Inscripción duplicada → FALLA", r.status_code == 400, f"status={r.status_code}")

# Get class students
r = SESSION.get(f"{BASE}/classes/{class_id}/students")
test("Ver alumnos de la clase", r.status_code == 200 and len(r.json()) == 2, f"count={len(r.json()) if r.status_code == 200 else 'err'}")

# Get student classes
r = SESSION.get(f"{BASE}/students/{students[0]}/classes")
test("Ver clases del alumno", r.status_code == 200 and len(r.json()) >= 1, r.text[:200])

# Search students
r = SESSION.get(f"{BASE}/students?search=ana")
test("Buscar alumnos por nombre", r.status_code == 200 and len(r.json()) >= 1, r.text[:200])


# ─── 7. ATTENDANCE ───
section("7. ATTENDANCE (enrollment validation)")

# Get attendance form for schedule
r = SESSION.get(f"{BASE}/attendance/schedule/{schedule_id}")
test("Ver grilla asistencia del schedule", r.status_code == 200 and len(r.json()) == 2, r.text[:300])

# Record attendance for enrolled students
r = SESSION.post(f"{BASE}/attendance/schedule/{schedule_id}", json=[
    {"student_id": students[0], "present": True, "notes": "Llegó puntual"},
    {"student_id": students[1], "present": False, "notes": "Ausente sin aviso"},
])
test("Registrar asistencia (bulk)", r.status_code == 200, r.text[:200])

# Try recording attendance for NON-enrolled student (student 3)
r = SESSION.post(f"{BASE}/attendance/schedule/{schedule_id}", json=[
    {"student_id": students[2], "present": True, "notes": "No inscripto"},
])
test("Asistencia para no inscripto → FALLA", r.status_code == 400, f"status={r.status_code}, body={r.text[:200]}")

# Get student attendance history
r = SESSION.get(f"{BASE}/students/{students[0]}/attendance")
test("Historial asistencia del alumno", r.status_code == 200 and len(r.json()) >= 1, r.text[:200])


# ─── 8. BILLING ───
section("8. BILLING (with overdue)")

r = SESSION.post(f"{BASE}/billing", json={
    "student_id": students[0],
    "amount": 150.00,
    "due_date": "2026-06-01",
    "description": "Mensualidad Mayo",
})
test("Crear factura futura", r.status_code == 200, r.text[:200])
bill_id_future = r.json().get("id") if r.status_code == 200 else None

r = SESSION.post(f"{BASE}/billing", json={
    "student_id": students[0],
    "amount": 100.00,
    "due_date": "2025-01-01",  # PAST DATE
    "description": "Mensualidad vencida",
})
test("Crear factura con fecha vencida", r.status_code == 200, r.text[:200])
bill_id_past = r.json().get("id") if r.status_code == 200 else None

# Mark overdue
r = SESSION.post(f"{BASE}/billing/mark-overdue")
test("Marcar facturas vencidas como OVERDUE", r.status_code == 200, r.text[:200])

# Verify past bill is now OVERDUE
if bill_id_past:
    r = SESSION.get(f"{BASE}/billing/{bill_id_past}")
    test("Factura vencida → status OVERDUE", r.json().get("status") == "OVERDUE", f"status={r.json().get('status')}")

# Edit billing
if bill_id_future:
    r = SESSION.put(f"{BASE}/billing/{bill_id_future}", json={"status": "PAID", "paid_date": "2026-05-15"})
    test("Editar factura → marcar PAID", r.status_code == 200 and r.json().get("status") == "PAID", r.text[:200])

# Delete billing (cancel)
if bill_id_past:
    r = SESSION.delete(f"{BASE}/billing/{bill_id_past}")
    test("Cancelar factura → status CANCELLED", r.status_code == 200, r.text[:200])
    r = SESSION.get(f"{BASE}/billing/{bill_id_past}")
    test("Factura cancelada tiene status CANCELLED", r.json().get("status") == "CANCELLED", r.text[:200])

# Get student billing
r = SESSION.get(f"{BASE}/students/{students[0]}/billing")
test("Ver facturación del alumno", r.status_code == 200 and len(r.json()) >= 1, r.text[:200])


# ─── 9. DASHBOARD ───
section("9. DASHBOARD")

r = SESSION.get(f"{BASE}/dashboard")
test("Dashboard devuelve datos", r.status_code == 200, r.text[:300])
if r.status_code == 200:
    d = r.json()
    test("Dashboard: active_classes >= 1", d.get("active_classes", 0) >= 1)
    test("Dashboard: active_students >= 1", d.get("active_students", 0) >= 1)


# ─── 10. SOFT DELETE ───
section("10. SOFT DELETE")

# Delete teacher → should be logical
r = SESSION.delete(f"{BASE}/teachers/{teacher_id}")
test("Soft delete profesor", r.status_code == 200, r.text[:200])
r = SESSION.get(f"{BASE}/teachers")
test("Profesor eliminado no aparece en lista", all(t["id"] != teacher_id for t in r.json()), r.text[:200])


# ─── 11. ROLE PERMISSIONS ───
section("11. ROLE PERMISSIONS (create ADMIN, test restrictions)")

# Create an ADMIN user
r = SESSION.post(f"{BASE}/users", json={"name": "Admin Test", "email": "admintest@test.com", "password": "Test1234!", "role": "ADMIN"})
test("Crear usuario ADMIN", r.status_code == 200, r.text[:200])

# Login as ADMIN
admin_session = requests.Session()
r = admin_session.post(f"{BASE}/auth/login", json={"email": "admintest@test.com", "password": "Test1234!"})
test("Login como ADMIN", r.status_code == 200, r.text[:200])

# ADMIN should NOT be able to create classes
r = admin_session.post(f"{BASE}/classes", json={
    "name": "Clase Prohibida",
    "class_type_id": ct_id,
    "teacher_id": teacher_id,
    "max_students": 10,
})
test("ADMIN no puede crear clases → 403", r.status_code == 403, f"status={r.status_code}")

# ADMIN should NOT be able to manage users
r = admin_session.get(f"{BASE}/users")
test("ADMIN no puede listar usuarios → 403", r.status_code == 403, f"status={r.status_code}")

# ADMIN CAN create students
r = admin_session.post(f"{BASE}/students", json={"name": "Alumno por Admin", "email": "alumadmin@test.com"})
test("ADMIN puede crear alumnos → 200", r.status_code == 200, f"status={r.status_code}")

# ADMIN CAN view classes
r = admin_session.get(f"{BASE}/classes")
test("ADMIN puede ver clases → 200", r.status_code == 200, f"status={r.status_code}")


# ─── SUMMARY ───
section("RESUMEN")
total = PASS + FAIL
print(f"\n  Total: {total} tests")
print(f"  ✅ Pasaron: {PASS}")
print(f"  ❌ Fallaron: {FAIL}")
print()

if FAIL > 0:
    print("  ⚠️  HAY FALLOS - revisar antes de continuar")
    sys.exit(1)
else:
    print("  🎉 TODOS LOS TESTS PASARON - Core listo para construir la app")
    sys.exit(0)
