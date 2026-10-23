import psycopg
import pytest
from datetime import date, timedelta


def test_class_requires_assigned_trainer(db, setup_data):
    data = setup_data

    with pytest.raises(psycopg.errors.ForeignKeyViolation):
        with db.transaction():
            db.execute(
                """
                INSERT INTO cohort_classes
                    (cohort_id, trainer_id, class_date, topic)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    data["cohort1"], data["trainer2"],
                    date.today() - timedelta(days=1), "Invalid assignment",
                ),
            )