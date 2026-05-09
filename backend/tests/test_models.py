import importlib.util
import pathlib


def _load_models_module():
    # Load backend/models.py as a module without package init
    module_path = pathlib.Path(__file__).resolve().parents[1] / 'models.py'  # backend/models.py
    spec = importlib.util.spec_from_file_location('backend_models', str(module_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_schedule_fields():
    models = _load_models_module()
    Schedule = models.Schedule
    s = Schedule(start_time="08:00", end_time="09:00")
    assert s.start_time == "08:00"
    assert s.end_time == "09:00"


def test_classroom_in_db_no_extra_fields():
    models = _load_models_module()
    ClassroomInDB = models.ClassroomInDB
    cr = ClassroomInDB(name="Aula 1")
    data = cr.model_dump()
    assert "capacity" not in data
    assert "location" not in data
    assert data["name"] == "Aula 1"


def test_course_in_db_no_extra_relationships():
    models = _load_models_module()
    Schedule = models.Schedule
    CourseInDB = models.CourseInDB
    sched = Schedule(start_time="09:00", end_time="10:30")
    course = CourseInDB(name="Matemáticas", schedule=sched, start_month="2026-09", max_students=25)
    data = course.model_dump()
    assert "teacher_id" not in data
    assert "class_type_id" not in data
    assert data["schedule"]["start_time"] == "09:00"
    assert data["schedule"]["end_time"] == "10:30"


def test_billing_in_db_includes_period_and_pending_status():
    models = _load_models_module()
    BillingInDB = models.BillingInDB
    bill = BillingInDB(
        student_id="student-1",
        amount=150.0,
        due_date="2026-05-10",
        billing_period="2026-05",
    )
    data = bill.model_dump()
    assert data["billing_period"] == "2026-05"
    assert data["status"] == "PENDING"


def test_billing_create_allows_optional_period():
    models = _load_models_module()
    BillingCreate = models.BillingCreate
    bill = BillingCreate(student_id="student-1", amount=150.0, due_date="2026-05-10")
    assert bill.billing_period is None


def test_billing_settings_update_and_output():
    models = _load_models_module()
    BillingSettingsUpdate = models.BillingSettingsUpdate
    BillingSettingsOut = models.BillingSettingsOut

    update = BillingSettingsUpdate(monthly_amount=275.5)
    output = BillingSettingsOut(monthly_amount=275.5, source="db")

    assert update.monthly_amount == 275.5
    assert output.monthly_amount == 275.5
    assert output.source == "db"
