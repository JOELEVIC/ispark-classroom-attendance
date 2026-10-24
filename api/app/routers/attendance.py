
from fastapi import APIRouter, HTTPException, Path, Query, status
from psycopg import IntegrityError

from app.repositories import attendance_repository
from app.repositories.cohort_repository import (
    CohortFinishedError,
    CohortNotFoundError,
)
from app.routers.cohort_errors import raise_cohort_error
from app.schemas.attendance import (
    AttendanceBatchCreate,
    AttendanceChangeHistoryRespond,
)

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
    try:
        results = attendance_repository.record_attendance_batch(
            class_id=class_id,
            cohort_id=cohort_id,
            records=[
                (entry.trainee_id, entry.status.value)
                for entry in payload.records
            ],
            trainer_id=trainer_id,
        )

    except (CohortNotFoundError, CohortFinishedError) as exc:
        raise_cohort_error(exc)
    except attendance_repository.TrainerNotAssignedToClassError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trainer assigned to this class can record attendance.",
        ) from exc
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Attendance could not be recorded. Check class, enrollment, trainer assignment, and status constraints.",
        ) from exc

    return {"records": results}


@router.get("/classes/{class_id}/attendance")
def get_class_attendance(class_id: int):
    return attendance_repository.get_attendance_by_class(class_id)


@router.get(
    "/classes/{class_id}/attendance/{trainee_id}/history",
    response_model=list[AttendanceChangeHistoryRespond],
)
def get_attendance_change_history(
    class_id: int = Path(gt=0),
    trainee_id: int = Path(gt=0),
):
    return attendance_repository.get_attendance_change_history(
        class_id, trainee_id
    )


@router.get("/trainees/{trainee_id}/attendance")
def get_trainee_history(
    trainee_id: int,
    cohort_id: int = Query(gt=0),
):
    return attendance_repository.get_trainee_attendance_history(
        trainee_id, cohort_id
    )
