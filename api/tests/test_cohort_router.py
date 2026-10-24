from types import SimpleNamespace

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


def test_create_cohort_strips_name_and_rejects_short_name():
    response = TestClient(app).post(
        "/cohorts/",
        json={
            "program_id": 1,
            "name": "  ",
            "start_date": "2026-01-01",
            "end_date": "2026-02-01",
        },
    )

    assert response.status_code == 422
    assert any(
        error["loc"][-1] == "name" and error["type"] == "string_too_short"
        for error in response.json()["detail"]
    )


def test_create_cohort_reports_invalid_date_range():
    response = TestClient(app).post(
        "/cohorts/",
        json={
            "program_id": 1,
            "name": "Valid cohort",
            "start_date": "2026-02-01",
            "end_date": "2026-02-01",
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == (
        "Value error, End date must be after start date."
    )


def test_create_cohort_reports_duplicate_name(monkeypatch):
    class FakeIntegrityError(Exception):
        diag = SimpleNamespace(
            constraint_name="cohorts_unique_name_per_program"
        )

    monkeypatch.setattr(cohort, "IntegrityError", FakeIntegrityError)

    def raise_duplicate(*_):
        raise FakeIntegrityError

    monkeypatch.setattr(cohort.cohort_repository, "create_cohort", raise_duplicate)

    response = TestClient(app).post(
        "/cohorts/",
        json={
            "program_id": 1,
            "name": "Cohort A",
            "start_date": "2026-01-01",
            "end_date": "2026-02-01",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "A cohort named 'Cohort A' already exists in this program. "
        "Choose a different name."
    )


def test_create_cohort_reports_missing_program(monkeypatch):
    class FakeIntegrityError(Exception):
        diag = SimpleNamespace(constraint_name="cohorts_program_id_fkey")

    monkeypatch.setattr(cohort, "IntegrityError", FakeIntegrityError)

    def raise_missing_program(*_):
        raise FakeIntegrityError

    monkeypatch.setattr(
        cohort.cohort_repository, "create_cohort", raise_missing_program
    )
    response = TestClient(app).post(
        "/cohorts/",
        json={
            "program_id": 999,
            "name": "Cohort A",
            "start_date": "2026-01-01",
            "end_date": "2026-02-01",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "The selected program does not exist. Choose an existing program."
    )


def test_create_cohort_trims_name_before_persisting(monkeypatch):
    captured = {}

    def fake_create(program_id, name, start_date, end_date):
        captured["name"] = name
        return {
            "id": 10,
            "program_id": program_id,
            "name": name,
            "start_date": start_date,
            "end_date": end_date,
            "is_finished": False,
        }

    monkeypatch.setattr(
        cohort.cohort_repository, "create_cohort", fake_create
    )
    response = TestClient(app).post(
        "/cohorts/",
        json={
            "program_id": 1,
            "name": "  Cohort A  ",
            "start_date": "2026-01-01",
            "end_date": "2026-02-01",
        },
    )

    assert response.status_code == 201
    assert captured["name"] == "Cohort A"
