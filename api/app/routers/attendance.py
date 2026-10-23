
from fastapi import APIRouter, HTTPException, Query, status
from psycopg import IntegrityError

from app.repositories import attendance_repository
from app.schemas.attendance import AttendanceBatchCreate

router = APIRouter(tags=["Attendance"])


@router.post(
    "/classes/{class_id}/attendance",
    status_code=status.HTTP_201_CREATED,
)
def record_class_attendance(
    class_id: int,
    payload: AttendanceBatchCreate,
    cohort_id: int = Query(gt=0),
    trainer_id: int = Query(gt=0),
):
    results = []

    try:
        for entry in payload.records:
            result = attendance_repository.record_attendance(
                class_id=class_id,
                cohort_id=cohort_id,
                trainee_id=entry.trainee_id,
                status=entry.status.value,
                trainer_id=trainer_id,
            )
            results.append(result)

    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Attendance could not be recorded. Check class, enrollment, trainer assignment, and status constraints.",
        ) from exc

    return {"records": results}


@router.get("/classes/{class_id}/attendance")
def get_class_attendance(class_id: int):
    return attendance_repository.get_attendance_by_class(class_id)


@router.get("/trainees/{trainee_id}/attendance")
def get_trainee_history(
    trainee_id: int,
    cohort_id: int = Query(gt=0),
):
    return attendance_repository.get_trainee_attendance_history(
        trainee_id, cohort_id
    )
