

from dataclasses import dataclass

@dataclass( frozen=True, slots=True)
class Trainee:
    id: int
    name: str