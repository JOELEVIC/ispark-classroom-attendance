import psycopg
import pytest
from datetime import date, timedelta


def test_cohort_end_date_must_follow_start_date(db, setup_data):
    data = setup_data

    with pytest.raises(psycopg.errors.CheckViolation):
        with db.transaction():
            db.execute(
                """
                INSERT INTO cohorts (program_id, name, start_date, end_date)
                SELECT program_id, %s, %s, %s
                FROM cohorts WHERE id = %s
                """,
                (
                    "Invalid date test", date.today(), date.today(),
                    data["cohort1"],
                ),
            )


def test_attendance_for_future_class_is_rejected(db, setup_data):
    data = setup_data

    # Create a future class inside the cohort's valid date range.
    with db.transaction():
        future_class = db.execute(
            """
            INSERT INTO cohort_classes
                (cohort_id, trainer_id, class_date, topic)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (
                data["cohort1"], data["trainer1"],
                date.today() + timedelta(days=1), "Future class test",
            ),
        ).fetchone()["id"]

    with pytest.raises(psycopg.Error):
        with db.transaction():
            db.execute(
                """
                INSERT INTO attendance
                    (class_id, cohort_id, trainee_id, status,
                     recorded_by, last_changed_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    future_class, data["cohort1"], data["trainee1"],
                    "PRESENT", data["trainer1"], data["trainer1"],
                ),
            )