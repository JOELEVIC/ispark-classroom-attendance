

from pydantic import BaseModel, Field


class ProgramCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None

class ProgramRespond(BaseModel):
    id: int
    name: str
    description: str | None