from fastapi.testclient import TestClient

from app.main import app
from app.routers import attendance


def test_attendance_change_history_endpoint_returns_corrections(monkeypatch):
    monkeypatch.setattr(
        attendance.attendance_repository,
        "get_attendance_change_history",
        lambda class_id, trainee_id: [
            {
                "id": 12,
                "attendance_id": 8,
                "old_status": "present",
                "new_status": "late",
                "changed_by": 3,
                "changed_by_name": "Jane Trainer",
                "changed_at": "2026-10-23T09:30:00Z",
            }
        ],
    )
    client = TestClient(app)

    response = client.get("/classes/5/attendance/9/history")

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": 12,
            "attendance_id": 8,
            "old_status": "present",
            "new_status": "late",
            "changed_by": 3,
            "changed_by_name": "Jane Trainer",
            "changed_at": "2026-10-23T09:30:00Z",
        }
    ]
