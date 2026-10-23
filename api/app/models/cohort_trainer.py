

from dataclasses import dataclass

@dataclass (frozen=True, slots=True)
class CohortTrainer:
    cohort_id: int
    trainer_id: int