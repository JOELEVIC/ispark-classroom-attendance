from pydantic import BaseModel, Field
from datetime import datetime


class EnrollmentCreate(BaseModel):
    trainee_id: int = Field(gt=0)


class EnrollmentRespond(BaseModel):
    id: int
    trainee_id: int
    cohort_id: int
    enrolled_at: datetime