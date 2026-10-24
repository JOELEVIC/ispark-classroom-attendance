from fastapi.testclient import TestClient

from app.main import app
from app.routers import enrollment


def test_import_enrollments_parses_names_and_reports_rows(monkeypatch):
    imported = {}

    def fake_import(cohort_id, rows):
        imported["cohort_id"] = cohort_id
        imported["rows"] = rows
        return {
            "imported_count": 1,
            "total_rows": 2,
            "failures": [
                {
                    "row": 3,
                    "name": "Missing Trainee",
                    "reason": "No existing trainee has this exact name.",
                }
            ],
        }

    monkeypatch.setattr(
        enrollment.enrollment_repository,
        "import_enrollments_by_name",
        fake_import,
    )

    response = TestClient(app).post(
        "/cohorts/10/enrollments/import",
        files={"file": ("trainees.csv", "Name\nAda Trainee\nMissing Trainee\n", "text/csv")},
    )

    assert response.status_code == 200
    assert imported == {
        "cohort_id": 10,
        "rows": [
            {"row": 2, "name": "Ada Trainee", "error": None},
            {"row": 3, "name": "Missing Trainee", "error": None},
        ],
    }
    assert response.json()["imported_count"] == 1
    assert response.json()["failures"][0]["row"] == 3


def test_import_enrollments_rejects_csv_without_name_header():
    response = TestClient(app).post(
        "/cohorts/10/enrollments/import",
        files={"file": ("trainees.csv", "trainee\nAda Trainee\n", "text/csv")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "CSV must contain exactly one column with a 'name' header."
    )
