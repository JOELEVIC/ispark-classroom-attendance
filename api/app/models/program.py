

from dataclasses import dataclass

@dataclass( frozen=True, slots=True)
class Program:
    id: int
    name: str
    description: str | None

  