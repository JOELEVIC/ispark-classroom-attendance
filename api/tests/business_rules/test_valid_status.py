import psycopg
import pytest


def test_only_fixed_statuses_are_allowed(db, setup_data):
    data = setup_data

    with pytest.raises(psycopg.errors.CheckViolation):
        with db.transaction():
            db.execute(
                """
                INSERT INTO attendance
                    (class_id, cohort_id, trainee_id, status,
                     recorded_by, last_changed_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    data["class_id"], data["cohort1"], data["trainee1"],
                    "MAYBE", data["trainer1"], data["trainer1"],
                ),
            )