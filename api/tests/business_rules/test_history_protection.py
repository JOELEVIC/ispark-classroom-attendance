import psycopg
import pytest


def test_trainee_with_attendance_cannot_be_deleted(db, setup_data):
    data = setup_data

    db.execute(
        """
        INSERT INTO attendance
            (class_id, cohort_id, trainee_id, status,
             recorded_by, last_changed_by)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            data["class_id"], data["cohort1"], data["trainee1"],
            "PRESENT", data["trainer1"], data["trainer1"],
        ),
    )

    with pytest.raises(psycopg.errors.ForeignKeyViolation):
        with db.transaction():
            db.execute(
                "DELETE FROM trainees WHERE id = %s",
                (data["trainee1"],),
            )