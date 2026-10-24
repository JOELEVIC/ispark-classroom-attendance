from fastapi.testclient import TestClient

from app.main import app
from app.routers import cohort_class


def test_create_repeating_classes_returns_created_and_skipped_dates(monkeypatch):
    captured = {}

    def fake_create(cohort_id, trainer_id, weekdays, topic):
        captured.update(
            cohort_id=cohort_id,
            trainer_id=trainer_id,
            weekdays=weekdays,
            topic=topic,
        )
        return {
            "created_count": 1,
            "skipped_dates": ["2026-01-05"],
            "classes": [
                {
                    "id": 20,
                    "cohort_id": cohort_id,
                    "trainer_id": trainer_id,
                    "class_date": "2026-01-12",
                    "topic": topic,
                }
            ],
        }

    monkeypatch.setattr(
        cohort_class.cohort_class_repository,
        "create_repeating_classes",
        fake_create,
    )
    response = TestClient(app).post(
        "/cohorts/10/classes/repeating",
        json={
            "trainer_id": 7,
            "weekdays": [0, 2],
            "topic": "API Foundations",
        },
    )

    assert response.status_code == 201
    assert captured == {
        "cohort_id": 10,
        "trainer_id": 7,
        "weekdays": [0, 2],
        "topic": "API Foundations",
    }
    assert response.json()["created_count"] == 1
    assert response.json()["skipped_dates"] == ["2026-01-05"]
    assert response.json()["classes"][0]["class_date"] == "2026-01-12"


def test_create_repeating_classes_rejects_empty_weekdays():
    response = TestClient(app).post(
        "/cohorts/10/classes/repeating",
        json={"trainer_id": 7, "weekdays": [], "topic": "API Foundations"},
    )

    assert response.status_code == 422
