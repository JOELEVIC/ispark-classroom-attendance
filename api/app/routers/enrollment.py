
import csv
import io

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from psycopg import IntegrityError

from app.repositories import enrollment_repository
from app.repositories.cohort_repository import (
    CohortFinishedError,
    CohortNotFoundError,
)
from app.routers.cohort_errors import raise_cohort_error
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentImportRespond,
    EnrollmentRespond,
)

router = APIRouter(prefix="/cohorts", tags=["Enrollments"])
MAX_IMPORT_SIZE = 1_000_000


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
    except (CohortNotFoundError, CohortFinishedError) as exc:
        raise_cohort_error(exc)
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


@router.post(
    "/{cohort_id}/enrollments/import",
    response_model=EnrollmentImportRespond,
)
async def import_enrollments(cohort_id: int, file: UploadFile = File(...)):
    content = await file.read(MAX_IMPORT_SIZE + 1)
    if len(content) > MAX_IMPORT_SIZE:
        raise HTTPException(
            status_code=413,
            detail="CSV file must be no larger than 1 MB.",
        )

    try:
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
        headers = reader.fieldnames
        if headers is None or [
            header.strip().lower() for header in headers
        ] != ["name"]:
            raise HTTPException(
                status_code=400,
                detail="CSV must contain exactly one column with a 'name' header.",
            )
        reader.fieldnames = ["name"]

        rows = []
        for record in reader:
            row_number = reader.line_num
            extra_values = record.get(None)
            name = record.get("name")
            rows.append(
                {
                    "row": row_number,
                    "name": name.strip() if name else "",
                    "error": (
                        "Row contains more columns than the header."
                        if extra_values
                        else None
                    ),
                }
            )
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="CSV file must use UTF-8 encoding.",
        ) from exc
    except csv.Error as exc:
        raise HTTPException(
            status_code=400,
            detail="CSV file is malformed.",
        ) from exc

    try:
        return enrollment_repository.import_enrollments_by_name(
            cohort_id, rows
        )
    except (CohortNotFoundError, CohortFinishedError) as exc:
        raise_cohort_error(exc)
