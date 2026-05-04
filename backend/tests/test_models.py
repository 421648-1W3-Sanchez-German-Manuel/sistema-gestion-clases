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
