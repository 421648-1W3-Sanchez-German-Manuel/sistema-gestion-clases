from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Dict, Iterable, Optional

from pymongo.errors import DuplicateKeyError

from models import BillingInDB


def _as_utc_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, str):
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    else:
        raise TypeError(f"Unsupported datetime value: {type(value)!r}")
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def current_billing_period(moment: Optional[datetime] = None) -> str:
    reference = _as_utc_datetime(moment or datetime.now(timezone.utc))
    return f"{reference.year:04d}-{reference.month:02d}"


def billing_period_due_date(billing_period: str) -> str:
    return f"{billing_period}-10"


def billing_period_from_due_date(due_date: str) -> str:
    return due_date[:7]


def _period_to_date(period: str) -> date:
    year, month = period.split("-")
    return date(int(year), int(month), 1)


def _date_to_period(value: Any) -> str:
    return current_billing_period(_as_utc_datetime(value))


def iter_billing_periods(start_period: str, end_period: str) -> Iterable[str]:
    start = _period_to_date(start_period)
    end = _period_to_date(end_period)
    year, month = start.year, start.month
    while (year, month) <= (end.year, end.month):
        yield f"{year:04d}-{month:02d}"
        month += 1
        if month == 13:
            year += 1
            month = 1


async def generate_monthly_billing(db, monthly_amount: float, target_moment: Optional[datetime] = None, logger=None) -> Dict[str, int]:
    target_period = current_billing_period(target_moment)
    students = await db.students.find(
        {"active": True, "course_id": {"$exists": True, "$ne": None}},
        {"_id": 0},
    ).to_list(10000)

    created = 0
    skipped = 0
    backfilled = 0

    for student in students:
        course_id = student.get("course_id")
        if not course_id:
            skipped += 1
            continue

        course = await db.courses.find_one({"id": course_id, "active": True}, {"_id": 0})
        if not course:
            skipped += 1
            continue

        student_period = _date_to_period(student.get("created_at"))
        course_period = course.get("start_month") or target_period
        start_period = max(student_period, course_period)

        existing_bills = await db.billing.find({"student_id": student["id"]}, {"_id": 0}).to_list(1000)
        existing_periods = {
            bill.get("billing_period") or billing_period_from_due_date(str(bill.get("due_date", "")))
            for bill in existing_bills
            if bill.get("billing_period") or bill.get("due_date")
        }

        for period in iter_billing_periods(start_period, target_period):
            if period in existing_periods:
                skipped += 1
                continue

            bill = BillingInDB(
                student_id=student["id"],
                amount=monthly_amount,
                due_date=billing_period_due_date(period),
                billing_period=period,
                description=f"Mensualidad {period}",
            )
            doc = bill.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()

            try:
                await db.billing.insert_one(doc)
            except DuplicateKeyError:
                skipped += 1
                continue

            created += 1
            if period != target_period:
                backfilled += 1

    summary = {"created": created, "skipped": skipped, "backfilled": backfilled}
    if logger:
        logger.info("Monthly billing run completed: %s", summary)
    return summary