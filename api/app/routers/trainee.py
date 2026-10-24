
from fastapi import APIRouter, HTTPException, Query, status
from app.repositories import trainee_repository
from app.schemas.trainee import (
    TraineeCreate,
    TraineePageRespond,
    TraineeRespond,
)

router = APIRouter(prefix="/trainees", tags=["Trainees"])


@router.post(
    "/",
    response_model=TraineeRespond,
    status_code=status.HTTP_201_CREATED,
)
def create_trainee(payload: TraineeCreate):
    return trainee_repository.create_trainee(payload.name)


@router.get("/", response_model=list[TraineeRespond])
def list_trainees():
    return trainee_repository.get_trainees()


@router.get("/search", response_model=TraineePageRespond)
def search_trainees(
    q: str = Query(default="", max_length=150),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    return trainee_repository.search_trainees(q.strip(), page, page_size)


@router.get("/{trainee_id}", response_model=TraineeRespond)
def get_trainee(trainee_id: int):
    trainee = trainee_repository.get_trainee_by_id(trainee_id)

    if trainee is None:
        raise HTTPException(status_code=404, detail="Trainee not found")

    return trainee
