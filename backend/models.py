from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date, time, timezone
import uuid


def generate_id() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ─── Users ───
class UserInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    email: str
    password_hash: str
    role: str  # ADMIN | SUPERUSER
    active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "ADMIN"  # ADMIN | SUPERUSER


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    active: bool
    created_at: datetime


# ─── Teachers ───
class TeacherInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class TeacherCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class TeacherOut(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    active: bool
    created_at: datetime


# ─── Class Types ───
class ClassTypeInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    description: Optional[str] = None
    active: bool = True


class ClassTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ClassTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ClassTypeOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    active: bool


# ─── Classes ───
class ClassInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    class_type_id: str
    teacher_id: str
    max_students: int
    start_date: Optional[str] = None  # ISO date string
    end_date: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class ClassCreate(BaseModel):
    name: str
    class_type_id: str
    teacher_id: str
    max_students: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    class_type_id: Optional[str] = None
    teacher_id: Optional[str] = None
    max_students: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ClassOut(BaseModel):
    id: str
    name: str
    class_type_id: str
    teacher_id: str
    max_students: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    active: bool
    created_at: datetime
    class_type_name: Optional[str] = None
    teacher_name: Optional[str] = None
    enrolled_count: Optional[int] = None


# ─── Classrooms ───
class ClassroomInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    capacity: int
    location: Optional[str] = None
    active: bool = True


class ClassroomCreate(BaseModel):
    name: str
    capacity: int
    location: Optional[str] = None


class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    location: Optional[str] = None


class ClassroomOut(BaseModel):
    id: str
    name: str
    capacity: int
    location: Optional[str] = None
    active: bool


# ─── Classroom Schedules ───
class ScheduleInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    classroom_id: str
    class_id: str
    date: str  # ISO date YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM


class ScheduleCreate(BaseModel):
    class_id: str
    date: str
    start_time: str
    end_time: str


class ScheduleUpdate(BaseModel):
    class_id: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class ScheduleOut(BaseModel):
    id: str
    classroom_id: str
    class_id: str
    date: str
    start_time: str
    end_time: str
    class_name: Optional[str] = None
    classroom_name: Optional[str] = None
    teacher_name: Optional[str] = None


# ─── Students ───
class StudentInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class StudentCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None


class StudentOut(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    active: bool
    created_at: datetime


# ─── Enrollments ───
class EnrollmentInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    class_id: str
    student_id: str
    enrollment_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    active: bool = True


class EnrollRequest(BaseModel):
    class_id: str


class EnrollmentOut(BaseModel):
    id: str
    class_id: str
    student_id: str
    enrollment_date: str
    active: bool
    class_name: Optional[str] = None
    student_name: Optional[str] = None


# ─── Attendance ───
class AttendanceRecord(BaseModel):
    student_id: str
    present: bool
    notes: Optional[str] = None


class AttendanceInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    schedule_id: str
    student_id: str
    present: bool
    notes: Optional[str] = None
    recorded_at: datetime = Field(default_factory=utc_now)


class AttendanceOut(BaseModel):
    id: str
    schedule_id: str
    student_id: str
    present: bool
    notes: Optional[str] = None
    recorded_at: datetime
    student_name: Optional[str] = None
    schedule_date: Optional[str] = None
    class_name: Optional[str] = None


# ─── Billing ───
class BillingInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    student_id: str
    amount: float
    due_date: str  # YYYY-MM-DD
    paid_date: Optional[str] = None
    status: str = "PENDING"  # PENDING | PAID | OVERDUE | CANCELLED
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


class BillingCreate(BaseModel):
    student_id: str
    amount: float
    due_date: str
    description: Optional[str] = None


class BillingUpdate(BaseModel):
    amount: Optional[float] = None
    due_date: Optional[str] = None
    paid_date: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


class BillingOut(BaseModel):
    id: str
    student_id: str
    amount: float
    due_date: str
    paid_date: Optional[str] = None
    status: str
    description: Optional[str] = None
    created_at: datetime
    student_name: Optional[str] = None


# ─── Auth ───
class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    message: str
    user: UserOut
