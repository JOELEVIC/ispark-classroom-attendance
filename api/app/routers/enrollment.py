
from fastapi import APIRouter, HTTPException, status
from psycopg import IntegrityError

from app.repositories import enrollment_repository
from app.schemas.enrollment import EnrollmentCreate, EnrollmentRespond

router = APIRouter(prefix="/cohorts", tags=["Enrollments"])


@router.post(
    "/{cohort_id}/enrollments",
    response_model=EnrollmentRespond,
    status_code=status.HTTP_201_CREATED,
)
def enroll_trainee(cohort_id: int, payload: EnrollmentCreate):
    try:
        return enrollment_repository.enroll_trainee(
            cohort_id, payload.trainee_id
        )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Enrollment failed. Check that the cohort and trainee exist and the enrollment is not duplicated.",
        ) from exc


@router.get(
    "/{cohort_id}/enrollments",
    response_model=list[EnrollmentRespond],
)
def list_enrollments(cohort_id: int):
    return enrollment_repository.get_enrollments_by_cohort(cohort_id)
