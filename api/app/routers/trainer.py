
from fastapi import APIRouter, HTTPException, status
from app.repositories import trainer_repository
from app.schemas.trainer import TrainerCreate, TrainerRespond

router = APIRouter(prefix="/trainers", tags=["Trainers"])


@router.post(
    "/",
    response_model=TrainerRespond,
    status_code=status.HTTP_201_CREATED,
)
def create_trainer(payload: TrainerCreate):
    return trainer_repository.create_trainer(payload.name)


@router.get("/", response_model=list[TrainerRespond])
def list_trainers():
    return trainer_repository.get_trainers()


@router.get("/{trainer_id}", response_model=TrainerRespond)
def get_trainer(trainer_id: int):
    trainer = trainer_repository.get_trainer_by_id(trainer_id)

    if trainer is None:
        raise HTTPException(status_code=404, detail="Trainer not found")

    return trainer
