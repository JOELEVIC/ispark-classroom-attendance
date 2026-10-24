from pydantic import BaseModel, Field
from datetime import datetime


class EnrollmentCreate(BaseModel):
    trainee_id: int = Field(gt=0)


class EnrollmentRespond(BaseModel):
    id: int
    trainee_id: int
    cohort_id: int
    enrolled_at: datetime
    trainee_name: str | None = None


class EnrollmentImportFailure(BaseModel):
    row: int
    name: str | None
    reason: str


class EnrollmentImportRespond(BaseModel):
    imported_count: int
    total_rows: int
    failures: list[EnrollmentImportFailure]