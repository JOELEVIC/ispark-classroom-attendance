from datetime import date
from pydantic import BaseModel, Field, model_validator


class CohortCreate(BaseModel):
    program_id: int = Field(gt=0)
    name: str = Field(min_length=2, max_length=150)
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")
        return self


class CohortRespond(BaseModel):
    id: int
    program_id: int
    name: str
    start_date: date
    end_date: date