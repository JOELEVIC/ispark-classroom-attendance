

from dataclasses import dataclass

@dataclass( frozen=True, slots=True)
class Cohort:
    id: int
    program_id: int
    name: str
    start_date: str
    end_date: str