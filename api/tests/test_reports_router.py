import pytest
from fastapi import HTTPException

from app.routers import reports


def test_cohort_attendance_report_marks_below_threshold(monkeypatch):
    monkeypatch.setattr(
        reports.report_repository,
        "get_cohort_attendance_report",
        lambda cohort_id: [
            {
                "trainee_id": 20,
                "trainee_name": "Sam Trainee",
                "counts": {
                    "present": 2,
                    "absent": 1,
                    "late": 0,
                    "excused": 0,
                },
                "attendance_rate": 66.67,
            },
            {
                "trainee_id": 21,
                "trainee_name": "Alex Student",
                "counts": {
                    "present": 0,
                    "absent": 0,
                    "late": 0,
                    "excused": 0,
                },
                "attendance_rate": None,
            },
        ],
    )

    result = reports.cohort_attendance_report(10)

    assert result["cohort_id"] == 10
    assert [item["below_threshold"] for item in result["trainees"]] == [
        True,
        False,
    ]


def test_class_attendance_summary_nests_counts(monkeypatch):
    monkeypatch.setattr(
        reports.report_repository,
        "get_class_attendance_summary",
        lambda class_id: {
            "class_id": class_id,
            "present": 2,
            "absent": 1,
            "late": 0,
            "excused": 0,
            "unmarked_trainees": [
                {"trainee_id": 21, "trainee_name": "Alex Student"}
            ],
        },
    )

    assert reports.class_attendance_summary(30) == {
        "class_id": 30,
        "counts": {"present": 2, "absent": 1, "late": 0, "excused": 0},
        "unmarked_trainees": [
            {"trainee_id": 21, "trainee_name": "Alex Student"}
        ],
    }


def test_class_attendance_summary_returns_not_found_for_unknown_class(
    monkeypatch,
):
    monkeypatch.setattr(
        reports.report_repository,
        "get_class_attendance_summary",
        lambda _class_id: None,
    )

    with pytest.raises(HTTPException) as error:
        reports.class_attendance_summary(999)

    assert error.value.status_code == 404
