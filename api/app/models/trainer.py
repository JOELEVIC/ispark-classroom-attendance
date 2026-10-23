

from dataclasses import dataclass

@dataclass( frozen=True, slots=True)
class Trainer:
    id: int
    name: str