
from fastapi import APIRouter, HTTPException, Query, status
from psycopg import IntegrityError

from app.repositories import cohort_repository
from app.repositories.cohort_repository import (
    CohortFinishedError,
    CohortNotFoundError,
)
from app.schemas.cohort import CohortCreate, CohortRespond
from app.schemas.trainer import CohortTrainerCreate, TrainerRespond
from app.routers.cohort_errors import raise_cohort_error

router = APIRouter(prefix="/cohorts", tags=["Cohorts"])


@router.post(
    "/",
    response_model=CohortRespond,
    status_code=status.HTTP_201_CREATED,
)
def create_cohort(payload: CohortCreate):
    try:
        return cohort_repository.create_cohort(
            payload.program_id,
            payload.name,
            payload.start_date,
            payload.end_date,
        )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Could not create cohort. Check the program and cohort constraints.",
        ) from exc


@router.get("/by-program/{program_id}", response_model=list[CohortRespond])
def list_cohorts_by_program(
    program_id: int,
    include_finished: bool = Query(default=False),
):
    return cohort_repository.get_cohorts_by_program(
        program_id, include_finished
    )


@router.get("/{cohort_id}", response_model=CohortRespond)
def get_cohort(cohort_id: int):
    cohort = cohort_repository.get_cohort_by_id(cohort_id)

    if cohort is None:
        raise HTTPException(status_code=404, detail="Cohort not found")

    return cohort


@router.post("/{cohort_id}/finish", response_model=CohortRespond)
def finish_cohort(cohort_id: int):
    cohort = cohort_repository.finish_cohort(cohort_id)
    if cohort is None:
        raise HTTPException(status_code=404, detail="Cohort not found")
    return cohort


@router.post(
    "/{cohort_id}/trainers",
    status_code=status.HTTP_201_CREATED,
)
def assign_trainer(cohort_id: int, payload: CohortTrainerCreate):
    try:
        return cohort_repository.assign_trainer(
            cohort_id, payload.trainer_id
        )
    except (CohortNotFoundError, CohortFinishedError) as exc:
        raise_cohort_error(exc)
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Trainer assignment failed. Check that both records exist and the assignment is not duplicated.",
        ) from exc


@router.get("/{cohort_id}/trainers", response_model=list[TrainerRespond])
def list_cohort_trainers(cohort_id: int):
    return cohort_repository.get_cohort_trainers(cohort_id)
