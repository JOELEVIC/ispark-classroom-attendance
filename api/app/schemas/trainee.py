from pydantic import BaseModel, Field


class TraineeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)


class TraineeRespond(BaseModel):
    id: int
    name: str