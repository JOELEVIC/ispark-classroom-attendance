from fastapi.testclient import TestClient

from app.main import app
from app.repositories.cohort_repository import CohortFinishedError
from app.routers import cohort


def test_list_cohorts_passes_finished_filter(monkeypatch):
    captured = {}

    def fake_list(program_id, include_finished):
        captured.update(program_id=program_id, include_finished=include_finished)
        return []

    monkeypatch.setattr(
        cohort.cohort_repository, "get_cohorts_by_program", fake_list
    )

    response = TestClient(app).get(
        "/cohorts/by-program/3?include_finished=true"
    )

    assert response.status_code == 200
    assert captured == {"program_id": 3, "include_finished": True}


def test_finished_cohort_rejects_trainer_assignment(monkeypatch):
    def reject_finished(*_):
        raise CohortFinishedError

    monkeypatch.setattr(
        cohort.cohort_repository, "assign_trainer", reject_finished
    )

    response = TestClient(app).post(
        "/cohorts/10/trainers", json={"trainer_id": 4}
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "This cohort is finished and read-only."
    )


def test_finish_cohort_preserves_and_returns_cohort_record(monkeypatch):
    monkeypatch.setattr(
        cohort.cohort_repository,
        "finish_cohort",
        lambda cohort_id: {
            "id": cohort_id,
            "program_id": 1,
            "name": "Cohort A",
            "start_date": "2026-01-01",
            "end_date": "2026-06-30",
            "is_finished": True,
        },
    )

    response = TestClient(app).post("/cohorts/10/finish")

    assert response.status_code == 200
    assert response.json()["id"] == 10
    assert response.json()["is_finished"] is True
