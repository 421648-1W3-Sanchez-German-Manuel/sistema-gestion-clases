from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone

from models import (
    UserInDB, UserCreate, UserUpdate, UserOut,
    TeacherInDB, TeacherCreate, TeacherUpdate, TeacherOut,
    ClassTypeInDB, ClassTypeCreate, ClassTypeUpdate, ClassTypeOut,
    ClassInDB, ClassCreate, ClassUpdate, ClassOut,
    ClassroomInDB, ClassroomCreate, ClassroomUpdate, ClassroomOut,
    ScheduleInDB, ScheduleCreate, ScheduleUpdate, ScheduleOut,
    StudentInDB, StudentCreate, StudentUpdate, StudentOut,
    EnrollmentInDB, EnrollRequest, EnrollmentOut,
    AttendanceInDB, AttendanceRecord, AttendanceOut,
    BillingInDB, BillingCreate, BillingUpdate, BillingOut,
    LoginRequest, LoginResponse,
)
from auth import (
    hash_password, verify_password, create_token, decode_token,
    get_current_user, require_role, set_auth_cookie, clear_auth_cookie,
    COOKIE_NAME,
)
from serializers import serialize_doc, serialize_list

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'gestion_clases')]

app = FastAPI(title="Sistema de Gestión de Clases", version="1.0.0")
api = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ─── Startup: Seed SUPERUSER ───
@app.on_event("startup")
async def startup_event():
    existing = await db.users.find_one({"email": "admin@sistema.com"})
    if not existing:
        seed_user = UserInDB(
            name="Super Administrador",
            email="admin@sistema.com",
            password_hash=hash_password("Admin1234!"),
            role="SUPERUSER",
        )
        doc = seed_user.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.users.insert_one(doc)
        logger.info("Seed SUPERUSER creado: admin@sistema.com")
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.teachers.create_index("id", unique=True)
    await db.class_types.create_index("id", unique=True)
    await db.classes.create_index("id", unique=True)
    await db.classrooms.create_index("id", unique=True)
    await db.classroom_schedules.create_index("id", unique=True)
    await db.students.create_index("id", unique=True)
    await db.class_enrollments.create_index("id", unique=True)
    await db.attendance.create_index("id", unique=True)
    await db.billing.create_index("id", unique=True)
    logger.info("Base de datos inicializada correctamente")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ─── AUTH ───
@api.post("/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email, "active": True}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = create_token(user["id"], user["role"], user["email"])
    user_out = UserOut(**serialize_doc(user))
    response = JSONResponse(content={"message": "Login exitoso", "user": user_out.model_dump(mode="json")})
    set_auth_cookie(response, token)
    return response


@api.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Sesión cerrada"})
    clear_auth_cookie(response)
    return response


@api.get("/auth/me")
async def get_me(request: Request):
    user_data = get_current_user(request)
    user = await db.users.find_one({"id": user_data["userId"], "active": True}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return UserOut(**serialize_doc(user)).model_dump(mode="json")


# ─── USERS (SUPERUSER only) ───
@api.get("/users")
async def list_users(request: Request, user=Depends(require_role("SUPERUSER"))):
    users = await db.users.find({"active": True}, {"_id": 0}).to_list(1000)
    return [UserOut(**serialize_doc(u)).model_dump(mode="json") for u in users]


@api.post("/users")
async def create_user(data: UserCreate, user=Depends(require_role("SUPERUSER"))):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    if data.role not in ["ADMIN", "SUPERUSER"]:
        raise HTTPException(status_code=400, detail="Rol inválido")
    new_user = UserInDB(
        name=data.name, email=data.email,
        password_hash=hash_password(data.password), role=data.role,
    )
    doc = new_user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.users.insert_one(doc)
    return UserOut(**serialize_doc(doc)).model_dump(mode="json")


@api.put("/users/{user_id}")
async def update_user(user_id: str, data: UserUpdate, user=Depends(require_role("SUPERUSER"))):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))
    if "role" in updates and updates["role"] not in ["ADMIN", "SUPERUSER"]:
        raise HTTPException(status_code=400, detail="Rol inválido")
    if not updates:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    result = await db.users.update_one({"id": user_id, "active": True}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    updated = await db.users.find_one({"id": user_id}, {"_id": 0})
    return UserOut(**serialize_doc(updated)).model_dump(mode="json")


@api.delete("/users/{user_id}")
async def delete_user(user_id: str, user=Depends(require_role("SUPERUSER"))):
    if user["userId"] == user_id:
        raise HTTPException(status_code=400, detail="No puede eliminarse a sí mismo")
    result = await db.users.update_one({"id": user_id, "active": True}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": "Usuario desactivado"}


# ─── TEACHERS ───
@api.get("/teachers")
async def list_teachers(request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    teachers = await db.teachers.find({"active": True}, {"_id": 0}).to_list(1000)
    return serialize_list(teachers)


@api.post("/teachers")
async def create_teacher(data: TeacherCreate, user=Depends(require_role("SUPERUSER"))):
    teacher = TeacherInDB(**data.model_dump())
    doc = teacher.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.teachers.insert_one(doc)
    return serialize_doc(doc)


@api.put("/teachers/{teacher_id}")
async def update_teacher(teacher_id: str, data: TeacherUpdate, user=Depends(require_role("SUPERUSER"))):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    result = await db.teachers.update_one({"id": teacher_id, "active": True}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profesor no encontrado")
    updated = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    return serialize_doc(updated)


@api.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str, user=Depends(require_role("SUPERUSER"))):
    result = await db.teachers.update_one({"id": teacher_id, "active": True}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profesor no encontrado")
    return {"message": "Profesor desactivado"}


# ─── CLASS TYPES ───
@api.get("/class-types")
async def list_class_types(request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    types = await db.class_types.find({"active": True}, {"_id": 0}).to_list(1000)
    return serialize_list(types)


@api.post("/class-types")
async def create_class_type(data: ClassTypeCreate, user=Depends(require_role("SUPERUSER"))):
    ct = ClassTypeInDB(**data.model_dump())
    doc = ct.model_dump()
    await db.class_types.insert_one(doc)
    return serialize_doc(doc)


@api.put("/class-types/{type_id}")
async def update_class_type(type_id: str, data: ClassTypeUpdate, user=Depends(require_role("SUPERUSER"))):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    result = await db.class_types.update_one({"id": type_id, "active": True}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tipo de clase no encontrado")
    updated = await db.class_types.find_one({"id": type_id}, {"_id": 0})
    return serialize_doc(updated)


@api.delete("/class-types/{type_id}")
async def delete_class_type(type_id: str, user=Depends(require_role("SUPERUSER"))):
    result = await db.class_types.update_one({"id": type_id, "active": True}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tipo de clase no encontrado")
    return {"message": "Tipo de clase desactivado"}


# ─── CLASSES ───
async def enrich_class(cls_doc):
    """Add type_name, teacher_name, enrolled_count to class doc."""
    doc = serialize_doc(cls_doc)
    ct = await db.class_types.find_one({"id": doc.get("class_type_id")}, {"_id": 0})
    doc["class_type_name"] = ct["name"] if ct else None
    teacher = await db.teachers.find_one({"id": doc.get("teacher_id")}, {"_id": 0})
    doc["teacher_name"] = teacher["name"] if teacher else None
    count = await db.class_enrollments.count_documents({"class_id": doc["id"], "active": True})
    doc["enrolled_count"] = count
    return doc


@api.get("/classes")
async def list_classes(request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    classes = await db.classes.find({"active": True}, {"_id": 0}).to_list(1000)
    return [await enrich_class(c) for c in classes]


@api.get("/classes/upcoming")
async def upcoming_classes(request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # Find schedules from today onwards
    schedules = await db.classroom_schedules.find({"date": {"$gte": today}}, {"_id": 0}).to_list(1000)
    class_ids = list(set(s["class_id"] for s in schedules))
    if not class_ids:
        return []
    classes = await db.classes.find({"id": {"$in": class_ids}, "active": True}, {"_id": 0}).to_list(1000)
    result = []
    for c in classes:
        enriched = await enrich_class(c)
        # Get next schedule
        cls_schedules = [s for s in schedules if s["class_id"] == c["id"]]
        cls_schedules.sort(key=lambda x: (x["date"], x["start_time"]))
        if cls_schedules:
            ns = cls_schedules[0]
            enriched["next_schedule_date"] = ns["date"]
            enriched["next_schedule_time"] = ns["start_time"]
            enriched["next_schedule_end_time"] = ns["end_time"]
            classroom = await db.classrooms.find_one({"id": ns["classroom_id"]}, {"_id": 0})
            enriched["next_classroom_name"] = classroom["name"] if classroom else None
        result.append(enriched)
    result.sort(key=lambda x: (x.get("next_schedule_date", ""), x.get("next_schedule_time", "")))
    return result


@api.get("/classes/{class_id}")
async def get_class(class_id: str, request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    cls = await db.classes.find_one({"id": class_id, "active": True}, {"_id": 0})
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    return await enrich_class(cls)


@api.post("/classes")
async def create_class(data: ClassCreate, user=Depends(require_role("SUPERUSER"))):
    # Validate teacher and class type exist
    teacher = await db.teachers.find_one({"id": data.teacher_id, "active": True})
    if not teacher:
        raise HTTPException(status_code=400, detail="Profesor no encontrado")
    ct = await db.class_types.find_one({"id": data.class_type_id, "active": True})
    if not ct:
        raise HTTPException(status_code=400, detail="Tipo de clase no encontrado")
    new_class = ClassInDB(**data.model_dump())
    doc = new_class.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.classes.insert_one(doc)
    return await enrich_class(doc)


@api.put("/classes/{class_id}")
async def update_class(class_id: str, data: ClassUpdate, user=Depends(require_role("SUPERUSER"))):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    result = await db.classes.update_one({"id": class_id, "active": True}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    updated = await db.classes.find_one({"id": class_id}, {"_id": 0})
    return await enrich_class(updated)


@api.delete("/classes/{class_id}")
async def delete_class(class_id: str, user=Depends(require_role("SUPERUSER"))):
    result = await db.classes.update_one({"id": class_id, "active": True}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    return {"message": "Clase desactivada"}


@api.get("/classes/{class_id}/students")
async def get_class_students(class_id: str, request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    enrollments = await db.class_enrollments.find({"class_id": class_id, "active": True}, {"_id": 0}).to_list(1000)
    result = []
    for e in enrollments:
        student = await db.students.find_one({"id": e["student_id"], "active": True}, {"_id": 0})
        if student:
            item = serialize_doc(e)
            item["student_name"] = student["name"]
            item["student_email"] = student.get("email")
            result.append(item)
    return result


# ─── CLASSROOMS ───
@api.get("/classrooms")
async def list_classrooms(request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    rooms = await db.classrooms.find({"active": True}, {"_id": 0}).to_list(1000)
    return serialize_list(rooms)


@api.get("/classrooms/{room_id}")
async def get_classroom(room_id: str, request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    room = await db.classrooms.find_one({"id": room_id, "active": True}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    return serialize_doc(room)


@api.post("/classrooms")
async def create_classroom(data: ClassroomCreate, user=Depends(require_role("SUPERUSER"))):
    room = ClassroomInDB(**data.model_dump())
    doc = room.model_dump()
    await db.classrooms.insert_one(doc)
    return serialize_doc(doc)


@api.put("/classrooms/{room_id}")
async def update_classroom(room_id: str, data: ClassroomUpdate, user=Depends(require_role("SUPERUSER"))):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    result = await db.classrooms.update_one({"id": room_id, "active": True}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    updated = await db.classrooms.find_one({"id": room_id}, {"_id": 0})
    return serialize_doc(updated)


@api.delete("/classrooms/{room_id}")
async def delete_classroom(room_id: str, user=Depends(require_role("SUPERUSER"))):
    result = await db.classrooms.update_one({"id": room_id, "active": True}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    return {"message": "Salón desactivado"}


# ─── CLASSROOM SCHEDULES ───
async def enrich_schedule(sched):
    doc = serialize_doc(sched)
    cls = await db.classes.find_one({"id": doc["class_id"]}, {"_id": 0})
    doc["class_name"] = cls["name"] if cls else None
    if cls:
        teacher = await db.teachers.find_one({"id": cls.get("teacher_id")}, {"_id": 0})
        doc["teacher_name"] = teacher["name"] if teacher else None
    else:
        doc["teacher_name"] = None
    room = await db.classrooms.find_one({"id": doc["classroom_id"]}, {"_id": 0})
    doc["classroom_name"] = room["name"] if room else None
    return doc


@api.get("/classrooms/{room_id}/schedules")
async def get_classroom_schedules(
    room_id: str,
    request: Request,
    date: Optional[str] = None,
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    query = {"classroom_id": room_id}
    if date:
        query["date"] = date
    schedules = await db.classroom_schedules.find(query, {"_id": 0}).to_list(1000)
    return [await enrich_schedule(s) for s in schedules]


def times_overlap(s1_start, s1_end, s2_start, s2_end):
    """Check if two time ranges overlap."""
    return s1_start < s2_end and s2_start < s1_end


@api.post("/classrooms/{room_id}/schedules")
async def create_schedule(
    room_id: str, data: ScheduleCreate,
    user=Depends(require_role("SUPERUSER")),
):
    # Validate classroom exists
    room = await db.classrooms.find_one({"id": room_id, "active": True})
    if not room:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    # Validate class exists
    cls = await db.classes.find_one({"id": data.class_id, "active": True})
    if not cls:
        raise HTTPException(status_code=400, detail="Clase no encontrada")
    # Check scheduling conflict
    existing = await db.classroom_schedules.find(
        {"classroom_id": room_id, "date": data.date}, {"_id": 0}
    ).to_list(1000)
    for ex in existing:
        if times_overlap(data.start_time, data.end_time, ex["start_time"], ex["end_time"]):
            raise HTTPException(status_code=409, detail="Conflicto de horario: el salón ya tiene una clase programada en ese rango")
    schedule = ScheduleInDB(classroom_id=room_id, **data.model_dump())
    doc = schedule.model_dump()
    await db.classroom_schedules.insert_one(doc)
    return await enrich_schedule(doc)


@api.put("/classrooms/schedules/{schedule_id}")
async def update_schedule(
    schedule_id: str, data: ScheduleUpdate,
    user=Depends(require_role("SUPERUSER")),
):
    sched = await db.classroom_schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule no encontrado")
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    # Check conflict with new times
    new_date = updates.get("date", sched["date"])
    new_start = updates.get("start_time", sched["start_time"])
    new_end = updates.get("end_time", sched["end_time"])
    existing = await db.classroom_schedules.find(
        {"classroom_id": sched["classroom_id"], "date": new_date, "id": {"$ne": schedule_id}}, {"_id": 0}
    ).to_list(1000)
    for ex in existing:
        if times_overlap(new_start, new_end, ex["start_time"], ex["end_time"]):
            raise HTTPException(status_code=409, detail="Conflicto de horario")
    await db.classroom_schedules.update_one({"id": schedule_id}, {"$set": updates})
    updated = await db.classroom_schedules.find_one({"id": schedule_id}, {"_id": 0})
    return await enrich_schedule(updated)


@api.delete("/classrooms/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str, user=Depends(require_role("SUPERUSER"))):
    result = await db.classroom_schedules.delete_one({"id": schedule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule no encontrado")
    return {"message": "Schedule eliminado"}


# ─── STUDENTS ───
@api.get("/students")
async def list_students(
    request: Request,
    search: Optional[str] = None,
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    query = {"active": True}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    students = await db.students.find(query, {"_id": 0}).to_list(1000)
    return serialize_list(students)


@api.get("/students/{student_id}")
async def get_student(student_id: str, request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    student = await db.students.find_one({"id": student_id, "active": True}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return serialize_doc(student)


@api.post("/students")
async def create_student(data: StudentCreate, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    student = StudentInDB(**data.model_dump())
    doc = student.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.students.insert_one(doc)
    return serialize_doc(doc)


@api.put("/students/{student_id}")
async def update_student(student_id: str, data: StudentUpdate, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    result = await db.students.update_one({"id": student_id, "active": True}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    return serialize_doc(updated)


@api.delete("/students/{student_id}")
async def delete_student(student_id: str, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    result = await db.students.update_one({"id": student_id, "active": True}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    # Also deactivate enrollments
    await db.class_enrollments.update_many({"student_id": student_id, "active": True}, {"$set": {"active": False}})
    return {"message": "Alumno desactivado"}


# ─── ENROLLMENTS ───
@api.get("/students/{student_id}/classes")
async def get_student_classes(student_id: str, request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    enrollments = await db.class_enrollments.find({"student_id": student_id, "active": True}, {"_id": 0}).to_list(1000)
    result = []
    for e in enrollments:
        cls = await db.classes.find_one({"id": e["class_id"]}, {"_id": 0})
        if cls:
            item = serialize_doc(e)
            item["class_name"] = cls["name"]
            enriched = await enrich_class(cls)
            item["class_type_name"] = enriched.get("class_type_name")
            item["teacher_name"] = enriched.get("teacher_name")
            result.append(item)
    return result


@api.post("/students/{student_id}/enroll")
async def enroll_student(
    student_id: str, data: EnrollRequest,
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    # Validate student
    student = await db.students.find_one({"id": student_id, "active": True})
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    # Validate class
    cls = await db.classes.find_one({"id": data.class_id, "active": True}, {"_id": 0})
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    # Check already enrolled
    existing = await db.class_enrollments.find_one(
        {"class_id": data.class_id, "student_id": student_id, "active": True}
    )
    if existing:
        raise HTTPException(status_code=400, detail="El alumno ya está inscripto en esta clase")
    # Check max_students
    count = await db.class_enrollments.count_documents({"class_id": data.class_id, "active": True})
    if count >= cls["max_students"]:
        raise HTTPException(status_code=400, detail="La clase ha alcanzado el límite máximo de alumnos")
    enrollment = EnrollmentInDB(class_id=data.class_id, student_id=student_id)
    doc = enrollment.model_dump()
    await db.class_enrollments.insert_one(doc)
    return serialize_doc(doc)


@api.delete("/students/{student_id}/enroll/{class_id}")
async def unenroll_student(
    student_id: str, class_id: str,
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    result = await db.class_enrollments.update_one(
        {"student_id": student_id, "class_id": class_id, "active": True},
        {"$set": {"active": False}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    return {"message": "Alumno desinscripto"}


# ─── ATTENDANCE ───
@api.get("/students/{student_id}/attendance")
async def get_student_attendance(student_id: str, request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    records = await db.attendance.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    result = []
    for r in records:
        doc = serialize_doc(r)
        sched = await db.classroom_schedules.find_one({"id": r["schedule_id"]}, {"_id": 0})
        if sched:
            doc["schedule_date"] = sched["date"]
            doc["start_time"] = sched["start_time"]
            doc["end_time"] = sched["end_time"]
            cls = await db.classes.find_one({"id": sched["class_id"]}, {"_id": 0})
            doc["class_name"] = cls["name"] if cls else None
        result.append(doc)
    return result


@api.get("/attendance/schedule/{schedule_id}")
async def get_schedule_attendance(
    schedule_id: str, request: Request,
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    sched = await db.classroom_schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule no encontrado")
    # Get enrolled students
    enrollments = await db.class_enrollments.find(
        {"class_id": sched["class_id"], "active": True}, {"_id": 0}
    ).to_list(1000)
    # Get existing attendance
    existing = await db.attendance.find({"schedule_id": schedule_id}, {"_id": 0}).to_list(1000)
    att_map = {a["student_id"]: serialize_doc(a) for a in existing}
    result = []
    for e in enrollments:
        student = await db.students.find_one({"id": e["student_id"], "active": True}, {"_id": 0})
        if student:
            att = att_map.get(e["student_id"])
            result.append({
                "student_id": e["student_id"],
                "student_name": student["name"],
                "present": att["present"] if att else None,
                "notes": att.get("notes", "") if att else "",
                "attendance_id": att["id"] if att else None,
            })
    return result


@api.post("/attendance/schedule/{schedule_id}")
async def record_attendance(
    schedule_id: str,
    records: List[AttendanceRecord],
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    sched = await db.classroom_schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule no encontrado")
    class_id = sched["class_id"]
    saved = []
    for rec in records:
        # Validate student is enrolled and active
        enrollment = await db.class_enrollments.find_one(
            {"class_id": class_id, "student_id": rec.student_id, "active": True}
        )
        if not enrollment:
            raise HTTPException(
                status_code=400,
                detail=f"Alumno {rec.student_id} no está inscripto o activo en la clase",
            )
        # Upsert attendance
        existing = await db.attendance.find_one(
            {"schedule_id": schedule_id, "student_id": rec.student_id}
        )
        if existing:
            await db.attendance.update_one(
                {"schedule_id": schedule_id, "student_id": rec.student_id},
                {"$set": {"present": rec.present, "notes": rec.notes, "recorded_at": datetime.now(timezone.utc).isoformat()}},
            )
        else:
            att = AttendanceInDB(
                schedule_id=schedule_id,
                student_id=rec.student_id,
                present=rec.present,
                notes=rec.notes,
            )
            doc = att.model_dump()
            doc["recorded_at"] = doc["recorded_at"].isoformat()
            await db.attendance.insert_one(doc)
        saved.append(rec.student_id)
    return {"message": f"Asistencia registrada para {len(saved)} alumnos", "student_ids": saved}


# ─── BILLING ───
@api.get("/billing")
async def list_billing(
    request: Request,
    status: Optional[str] = None,
    student_id: Optional[str] = None,
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    query = {}
    if status:
        query["status"] = status
    if student_id:
        query["student_id"] = student_id
    # Exclude cancelled unless specifically asked
    bills = await db.billing.find(query, {"_id": 0}).to_list(1000)
    result = []
    for b in bills:
        doc = serialize_doc(b)
        student = await db.students.find_one({"id": b["student_id"]}, {"_id": 0})
        doc["student_name"] = student["name"] if student else "Desconocido"
        result.append(doc)
    return result


@api.get("/billing/{bill_id}")
async def get_billing(bill_id: str, request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    bill = await db.billing.find_one({"id": bill_id}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    doc = serialize_doc(bill)
    student = await db.students.find_one({"id": bill["student_id"]}, {"_id": 0})
    doc["student_name"] = student["name"] if student else "Desconocido"
    return doc


@api.post("/billing")
async def create_billing(data: BillingCreate, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    student = await db.students.find_one({"id": data.student_id, "active": True})
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    bill = BillingInDB(**data.model_dump())
    doc = bill.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.billing.insert_one(doc)
    result = serialize_doc(doc)
    result["student_name"] = student["name"]
    return result


@api.put("/billing/{bill_id}")
async def update_billing(bill_id: str, data: BillingUpdate, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    if "status" in updates and updates["status"] not in ["PENDING", "PAID", "OVERDUE", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    result = await db.billing.update_one({"id": bill_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    updated = await db.billing.find_one({"id": bill_id}, {"_id": 0})
    doc = serialize_doc(updated)
    student = await db.students.find_one({"id": updated["student_id"]}, {"_id": 0})
    doc["student_name"] = student["name"] if student else "Desconocido"
    return doc


@api.delete("/billing/{bill_id}")
async def delete_billing(bill_id: str, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    result = await db.billing.update_one({"id": bill_id}, {"$set": {"status": "CANCELLED"}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return {"message": "Factura cancelada"}


# ─── DASHBOARD ───
@api.get("/dashboard")
async def get_dashboard(request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    active_classes = await db.classes.count_documents({"active": True})
    active_students = await db.students.count_documents({"active": True})
    active_teachers = await db.teachers.count_documents({"active": True})
    # Today's schedules
    today_schedules = await db.classroom_schedules.find({"date": today}, {"_id": 0}).to_list(100)
    today_classes = []
    for s in today_schedules:
        enriched = await enrich_schedule(s)
        today_classes.append(enriched)
    today_classes.sort(key=lambda x: x.get("start_time", ""))
    # Pending billing
    pending_bills = await db.billing.count_documents({"status": "PENDING"})
    overdue_bills = await db.billing.count_documents({"status": "OVERDUE"})
    return {
        "active_classes": active_classes,
        "active_students": active_students,
        "active_teachers": active_teachers,
        "today_classes": today_classes,
        "pending_bills": pending_bills,
        "overdue_bills": overdue_bills,
    }


# ─── MARK OVERDUE BILLING ───
@api.post("/billing/mark-overdue")
async def mark_overdue_billing(user=Depends(require_role("ADMIN", "SUPERUSER"))):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = await db.billing.update_many(
        {"status": "PENDING", "due_date": {"$lt": today}},
        {"$set": {"status": "OVERDUE"}},
    )
    return {"message": f"{result.modified_count} facturas marcadas como vencidas"}


# ─── ALL SCHEDULES (for calendar) ───
@api.get("/schedules")
async def list_all_schedules(
    request: Request,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    query = {}
    if date_from and date_to:
        query["date"] = {"$gte": date_from, "$lte": date_to}
    elif date_from:
        query["date"] = {"$gte": date_from}
    elif date_to:
        query["date"] = {"$lte": date_to}
    schedules = await db.classroom_schedules.find(query, {"_id": 0}).to_list(1000)
    return [await enrich_schedule(s) for s in schedules]


# ─── STUDENTS BILLING ───
@api.get("/students/{student_id}/billing")
async def get_student_billing(student_id: str, request: Request, user=Depends(require_role("ADMIN", "SUPERUSER"))):
    bills = await db.billing.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    result = []
    for b in bills:
        doc = serialize_doc(b)
        doc["student_name"] = student["name"] if student else "Desconocido"
        result.append(doc)
    return result


# ─── EXPORT ENDPOINTS ───
from exports import (
    export_students_csv, export_students_pdf,
    export_classes_csv, export_classes_pdf,
    export_billing_csv, export_billing_pdf,
    export_attendance_csv, export_attendance_pdf,
    export_teachers_csv, export_teachers_pdf,
)


@api.get("/export/students")
async def export_students(
    request: Request,
    format: str = Query("csv", regex="^(csv|pdf)$"),
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    students = await db.students.find({"active": True}, {"_id": 0}).to_list(10000)
    if format == "pdf":
        buf = export_students_pdf(students)
        return StreamingResponse(buf, media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=alumnos.pdf"})
    else:
        buf = export_students_csv(students)
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=alumnos.csv"})


@api.get("/export/classes")
async def export_classes_report(
    request: Request,
    format: str = Query("csv", regex="^(csv|pdf)$"),
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    classes = await db.classes.find({"active": True}, {"_id": 0}).to_list(10000)
    enriched = [await enrich_class(c) for c in classes]
    if format == "pdf":
        buf = export_classes_pdf(enriched)
        return StreamingResponse(buf, media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=clases.pdf"})
    else:
        buf = export_classes_csv(enriched)
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=clases.csv"})


@api.get("/export/billing")
async def export_billing_report(
    request: Request,
    format: str = Query("csv", regex="^(csv|pdf)$"),
    status: Optional[str] = None,
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    query = {}
    if status:
        query["status"] = status
    bills = await db.billing.find(query, {"_id": 0}).to_list(10000)
    for b in bills:
        student = await db.students.find_one({"id": b["student_id"]}, {"_id": 0})
        b["student_name"] = student["name"] if student else "Desconocido"
    if format == "pdf":
        buf = export_billing_pdf(bills)
        return StreamingResponse(buf, media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=facturacion.pdf"})
    else:
        buf = export_billing_csv(bills)
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=facturacion.csv"})


@api.get("/export/attendance/{schedule_id}")
async def export_attendance_report(
    schedule_id: str,
    request: Request,
    format: str = Query("csv", regex="^(csv|pdf)$"),
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    sched = await db.classroom_schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule no encontrado")
    # Get enrolled students + attendance
    enrollments = await db.class_enrollments.find(
        {"class_id": sched["class_id"], "active": True}, {"_id": 0}
    ).to_list(1000)
    existing = await db.attendance.find({"schedule_id": schedule_id}, {"_id": 0}).to_list(1000)
    att_map = {a["student_id"]: a for a in existing}
    records = []
    for e in enrollments:
        student = await db.students.find_one({"id": e["student_id"], "active": True}, {"_id": 0})
        if student:
            att = att_map.get(e["student_id"])
            records.append({
                "student_name": student["name"],
                "present": att["present"] if att else None,
                "notes": att.get("notes", "") if att else "",
            })
    # Enrich schedule info
    schedule_info = dict(sched)
    cls = await db.classes.find_one({"id": sched["class_id"]}, {"_id": 0})
    schedule_info["class_name"] = cls["name"] if cls else "-"
    room = await db.classrooms.find_one({"id": sched["classroom_id"]}, {"_id": 0})
    schedule_info["classroom_name"] = room["name"] if room else "-"

    if format == "pdf":
        buf = export_attendance_pdf(records, schedule_info)
        return StreamingResponse(buf, media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=asistencia.pdf"})
    else:
        buf = export_attendance_csv(records, schedule_info)
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=asistencia.csv"})


@api.get("/export/teachers")
async def export_teachers_report(
    request: Request,
    format: str = Query("csv", regex="^(csv|pdf)$"),
    user=Depends(require_role("ADMIN", "SUPERUSER")),
):
    teachers = await db.teachers.find({"active": True}, {"_id": 0}).to_list(10000)
    if format == "pdf":
        buf = export_teachers_pdf(teachers)
        return StreamingResponse(buf, media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=profesores.pdf"})
    else:
        buf = export_teachers_csv(teachers)
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=profesores.csv"})


# Include router + CORS
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
