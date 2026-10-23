

from dataclasses import dataclass
from datetime import date

@dataclass ( frozen=True, slots=True )
class CohortClass:
    id: int
    cohort_id: int
    trainer_id: int
    class_date: date
    topic: str