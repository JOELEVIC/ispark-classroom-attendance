from datetime import date
from pydantic import BaseModel, Field
from app.models import AttendanceStatus

class AttendanceCounts(BaseModel):
    present: int = Field(ge=0)
    absent: int = Field(ge=0)
    late: int = Field(ge=0)
    excused: int = Field(ge=0)


class TraineeAttendanceReport(BaseModel):
    trainee_id: int
    trainee_name: str
    counts: AttendanceCounts
    attendance_rate: float | None = Field(ge=0, le=100)
    below_threshold: bool


class TraineeAttendanceHistoryEntry(BaseModel):
    class_id: int
    class_date: date
    topic: str
    status: AttendanceStatus


class CohortAttendanceReport(BaseModel):
    cohort_id: int
    trainees: list[TraineeAttendanceReport]


class UnmarkedTrainee(BaseModel):
    trainee_id: int
    trainee_name: str


class ClassAttendanceSummary(BaseModel):
    class_id: int
    counts: AttendanceCounts
    unmarked_trainees: list[UnmarkedTrainee]