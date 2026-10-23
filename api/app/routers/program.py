
from fastapi import APIRouter, HTTPException, status
from psycopg import IntegrityError

from app.repositories import program_repository
from app.schemas.program import ProgramCreate, ProgramRespond

router = APIRouter(prefix="/programs", tags=["Programs"])


@router.post(
    "/",
    response_model=ProgramRespond,
    status_code=status.HTTP_201_CREATED,
)
def create_program(payload: ProgramCreate):
    try:
        return program_repository.create_program(
            payload.name, payload.description
        )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Could not create program because of a database constraint.",
        ) from exc


@router.get("/", response_model=list[ProgramRespond])
def list_programs():
    return program_repository.get_programs()


@router.get("/{program_id}", response_model=ProgramRespond)
def get_program(program_id: int):
    program = program_repository.get_program_by_id(program_id)

    if program is None:
        raise HTTPException(status_code=404, detail="Program not found")

    return program
