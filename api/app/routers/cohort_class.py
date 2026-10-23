
from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from psycopg import IntegrityError

from app.repositories import cohort_class_repository
from app.schemas.cohort_class import (
    CohortClassCreate,
    CohortClassRespond,
)

router = APIRouter(tags=["Classes"])


@router.post(
    "/cohorts/{cohort_id}/classes",
    response_model=CohortClassRespond,
    status_code=status.HTTP_201_CREATED,
)
def create_class(cohort_id: int, payload: CohortClassCreate):
    try:
        return cohort_class_repository.create_class(
            cohort_id,
            payload.trainer_id,
            payload.class_date,
            payload.topic,
        )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Class creation failed. Check trainer assignment and cohort date constraints.",
        ) from exc


@router.get(
    "/cohorts/{cohort_id}/classes",
    response_model=list[CohortClassRespond],
)
def list_classes(
    cohort_id: int,
    class_date: date | None = Query(default=None),
):
    classes = cohort_class_repository.get_classes_by_cohort(cohort_id)

    if class_date is not None:
        classes = [
            item for item in classes
            if item["class_date"] == class_date
        ]

    return classes


@router.get("/classes/{class_id}", response_model=CohortClassRespond)
def get_class(class_id: int):
    result = cohort_class_repository.get_class_by_id(class_id)

    if result is None:
        raise HTTPException(status_code=404, detail="Class not found")

    return result
