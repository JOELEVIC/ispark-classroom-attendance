from datetime import date
from pydantic import BaseModel, Field, model_validator


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


class RepeatingCohortClassesCreate(BaseModel):
    trainer_id: int = Field(gt=0)
    weekdays: list[int] = Field(min_length=1, max_length=7)
    topic: str = Field(min_length=2, max_length=200)

    @model_validator(mode="after")
    def validate_weekdays(self):
        if any(day < 0 or day > 6 for day in self.weekdays):
            raise ValueError("Weekdays must be between 0 (Monday) and 6 (Sunday)")
        if len(set(self.weekdays)) != len(self.weekdays):
            raise ValueError("Weekdays must not contain duplicates")
        return self


class RepeatingCohortClassesRespond(BaseModel):
    created_count: int
    skipped_dates: list[date]
    classes: list[CohortClassRespond]