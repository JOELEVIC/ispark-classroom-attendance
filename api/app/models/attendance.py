

from dataclasses import dataclass
from enum import Enum
from datetime import datetime

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"

@dataclass ( frozen=True, slots=True)
class Attendance:
    id: int
    class_id: int
    cohort_id: int
    trainee_id: int
    status: AttendanceStatus
    recorded_by: int
    last_changed_by: int
    created_at: datetime
    updated_at: datetime