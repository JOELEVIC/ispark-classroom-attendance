from pydantic import BaseModel, Field


class TrainerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)


class TrainerRespond(BaseModel):
    id: int
    name: str


class CohortTrainerCreate(BaseModel):
    trainer_id: int = Field(gt=0)