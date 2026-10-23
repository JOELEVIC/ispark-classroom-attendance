

from dataclasses import dataclass

@dataclass( frozen=True, slots=True)
class Enrollment:
    id: int
    trainee_id: int
    cohort_id: int
    enrolled_at: str