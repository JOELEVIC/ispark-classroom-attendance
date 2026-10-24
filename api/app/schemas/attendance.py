from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from app.models import AttendanceStatus



class AttendanceEntry(BaseModel):
    trainee_id: int = Field(gt=0)
    status: AttendanceStatus


class AttendanceBatchCreate(BaseModel):
    records: list[AttendanceEntry] = Field(min_length=1)


class AttendanceRespond(BaseModel):
    id: int
    class_id: int
    cohort_id: int
    trainee_id: int
    status: AttendanceStatus
    recorded_by: int
    last_changed_by: int
    created_at: datetime
    updated_at: datetime


class AttendanceChangeHistoryRespond(BaseModel):
    id: int
    attendance_id: int
    old_status: AttendanceStatus
    new_status: AttendanceStatus
    changed_by: int
    changed_by_name: str
    changed_at: datetime