from pydantic import BaseModel, Field


class TraineeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)


class TraineeRespond(BaseModel):
    id: int
    name: str


class TraineeSearchRespond(BaseModel):
    id: int
    name: str
    cohorts: list[str]


class TraineePageRespond(BaseModel):
    items: list[TraineeSearchRespond]
    total: int
    page: int
    page_size: int
    total_pages: int