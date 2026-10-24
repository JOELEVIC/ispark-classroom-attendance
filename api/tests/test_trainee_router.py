from fastapi.testclient import TestClient

from app.main import app
from app.routers import trainee


def test_search_trainees_returns_page_metadata_and_cohorts(monkeypatch):
    monkeypatch.setattr(
        trainee.trainee_repository,
        "search_trainees",
        lambda query, page, page_size: {
            "items": [
                {
                    "id": 7,
                    "name": "Ada Trainee",
                    "cohorts": ["API Foundations", "Web Development"],
                }
            ],
            "total": 11,
            "page": page,
            "page_size": page_size,
            "total_pages": 2,
        },
    )

    response = TestClient(app).get(
        "/trainees/search?q=Ada&page=2&page_size=10"
    )

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "id": 7,
                "name": "Ada Trainee",
                "cohorts": ["API Foundations", "Web Development"],
            }
        ],
        "total": 11,
        "page": 2,
        "page_size": 10,
        "total_pages": 2,
    }


def test_search_trainees_validates_page_size():
    response = TestClient(app).get("/trainees/search?page_size=101")

    assert response.status_code == 422
