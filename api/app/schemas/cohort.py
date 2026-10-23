from datetime import date
from pydantic import BaseModel, Field


class CohortClassCreate(BaseModel):
    trainer_id: int = Field(gt=0)
    class_date: date
    topic: str = Field(min_length=2, max_length=200)


class CohortClassRespond(BaseModel):
    id: int
    cohort_id: int
    trainer_id: int
    class_date: date
    topic: str