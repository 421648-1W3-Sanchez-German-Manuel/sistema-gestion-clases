import importlib.util
import pathlib
from datetime import datetime, timezone


def _load_billing_jobs_module():
    module_path = pathlib.Path(__file__).resolve().parents[1] / 'billing_jobs.py'
    spec = importlib.util.spec_from_file_location('backend_billing_jobs', str(module_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_current_billing_period_uses_utc_month():
    mod = _load_billing_jobs_module()
    assert mod.current_billing_period(datetime(2026, 5, 9, 14, 0, tzinfo=timezone.utc)) == '2026-05'


def test_billing_period_due_date_is_the_tenth():
    mod = _load_billing_jobs_module()
    assert mod.billing_period_due_date('2026-05') == '2026-05-10'


def test_iter_billing_periods_is_inclusive():
    mod = _load_billing_jobs_module()
    assert list(mod.iter_billing_periods('2026-03', '2026-05')) == ['2026-03', '2026-04', '2026-05']