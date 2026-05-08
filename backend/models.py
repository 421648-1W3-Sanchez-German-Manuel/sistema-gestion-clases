from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone


def generate_id() -> str:
    import uuid
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ─── Shared ───
class Schedule(BaseModel):
    # day_of_week removed per Correcciones.md
    start_time: str        # e.g. "10:00"
    end_time: str          # e.g. "12:00"


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
    role: str = "ADMIN"


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


# ─── Classrooms ───
class ClassroomInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    # capacity and location removed per Correcciones.md
    active: bool = True


class ClassroomCreate(BaseModel):
    name: str


class ClassroomUpdate(BaseModel):
    name: Optional[str] = None


class ClassroomOut(BaseModel):
    id: str
    name: str
    active: bool


# ─── Courses ───
class CourseInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    # teacher_id and class_type_id removed per Correcciones.md
    schedule: Schedule
    start_month: str          # YYYY-MM
    max_students: int
    active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class CourseCreate(BaseModel):
    name: str
    schedule: Schedule
    start_month: str
    max_students: int


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    schedule: Optional[Schedule] = None
    start_month: Optional[str] = None
    max_students: Optional[int] = None


class CourseOut(BaseModel):
    id: str
    name: str
    schedule: Schedule
    start_month: str
    max_students: int
    active: bool
    created_at: datetime
    # Optional aggregations for UI
    teacher_name: Optional[str] = None
    class_type_name: Optional[str] = None
    student_count: Optional[int] = None


# ─── Class Sessions ───
class ClassSessionInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    course_id: str
    teacher_id: str
    class_type_id: str
    date: str                 # YYYY-MM-DD
    start_time: str
    end_time: str
    classroom_id: str
    recovered: bool = False
    active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class ClassSessionCreate(BaseModel):
    course_id: str
    teacher_id: str
    class_type_id: str
    date: str
    start_time: str
    end_time: str
    classroom_id: str
    recovered: bool = False


class ClassSessionUpdate(BaseModel):
    course_id: Optional[str] = None
    teacher_id: Optional[str] = None
    class_type_id: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    classroom_id: Optional[str] = None
    recovered: Optional[bool] = None


class ClassSessionOut(BaseModel):
    id: str
    course_id: str
    teacher_id: str
    class_type_id: str
    date: str
    start_time: str
    end_time: str
    classroom_id: str
    recovered: bool
    active: bool
    created_at: datetime
    course_name: Optional[str] = None
    classroom_name: Optional[str] = None
    teacher_name: Optional[str] = None
    class_type_name: Optional[str] = None


# ─── Students ───
class Guardian(BaseModel):
    name: str
    phone: str


class StudentInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    guardian: Optional[Guardian] = None
    course_id: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class StudentCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    guardian: Optional[Guardian] = None
    course_id: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    guardian: Optional[Guardian] = None
    course_id: Optional[str] = None


class StudentOut(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    guardian: Optional[Guardian] = None
    course_id: Optional[str] = None
    active: bool
    created_at: datetime
    course_name: Optional[str] = None


# ─── Attendance ───
class AttendanceBulkItem(BaseModel):
    student_id: str
    present: bool
    notes: Optional[str] = None


class AttendanceInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    class_id: str
    student_id: str
    present: bool
    notes: Optional[str] = None
    recorded_at: datetime = Field(default_factory=utc_now)


class AttendanceOut(BaseModel):
    id: str
    class_id: str
    student_id: str
    present: bool
    notes: Optional[str] = None
    recorded_at: datetime
    student_name: Optional[str] = None
    class_date: Optional[str] = None
    course_name: Optional[str] = None


class StudentWithAttendance(BaseModel):
    student_id: str
    student_name: str
    present: bool = False
    notes: str = ""
    attendance_id: Optional[str] = None


# ─── Billing ───
class BillingInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    student_id: str
    amount: float
    due_date: str
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
