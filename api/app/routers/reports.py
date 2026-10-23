
from fastapi import APIRouter, HTTPException

from app.repositories import report_repository
from app.schemas.reports import (
    ClassAttendanceSummary,
    CohortAttendanceReport,
)

router = APIRouter(tags=["Reports"])


@router.get(
    "/cohorts/{cohort_id}/attendance-report",
    response_model=CohortAttendanceReport,
)
def cohort_attendance_report(cohort_id: int):
    records = report_repository.get_cohort_attendance_report(cohort_id)

    for record in records:
        rate = record["attendance_rate"]
        record["below_threshold"] = rate is not None and rate < 75

    return {"cohort_id": cohort_id, "trainees": records}


@router.get(
    "/classes/{class_id}/attendance-summary",
    response_model=ClassAttendanceSummary,
)
def class_attendance_summary(class_id: int):
    summary = report_repository.get_class_attendance_summary(class_id)
    if summary is None:
        raise HTTPException(status_code=404, detail="Class not found")

    summary["counts"] = {
        "present": summary.pop("present"),
        "absent": summary.pop("absent"),
        "late": summary.pop("late"),
        "excused": summary.pop("excused"),
    }
    return summary
