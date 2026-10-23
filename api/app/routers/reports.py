
from fastapi import APIRouter

from app.repositories import report_repository

router = APIRouter(tags=["Reports"])


@router.get("/cohorts/{cohort_id}/attendance-report")
def cohort_attendance_report(cohort_id: int):
    records = report_repository.get_cohort_attendance_report(cohort_id)

    for record in records:
        rate = record["attendance_rate"]
        record["below_threshold"] = rate is not None and rate < 75

    return {"cohort_id": cohort_id, "trainees": records}


@router.get("/classes/{class_id}/attendance-summary")
def class_attendance_summary(class_id: int):
    return report_repository.get_class_attendance_summary(class_id)
