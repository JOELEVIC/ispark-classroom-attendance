from typing import NoReturn

from fastapi import HTTPException

from app.repositories.cohort_repository import (
    CohortFinishedError,
    CohortNotFoundError,
)


def raise_cohort_error(error: Exception) -> NoReturn:
    if isinstance(error, CohortNotFoundError):
        raise HTTPException(status_code=404, detail="Cohort not found") from error
    if isinstance(error, CohortFinishedError):
        raise HTTPException(
            status_code=409,
            detail="This cohort is finished and read-only.",
        ) from error
    raise error
