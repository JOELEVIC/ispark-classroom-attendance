
from datetime import date, timedelta

import pytest

from app.db.connection import get_db_connection


@pytest.fixture
def db():
    """Provide a database connection and roll back test changes."""
    connection = get_db_connection()

    try:
        yield connection
    finally:
        connection.rollback()
        connection.close()


@pytest.fixture
def setup_data(db):
    """Create the minimal related records needed by business-rule tests."""

    today = date.today()
    unique = id(db)

    # Program
    program_id = db.execute(
        """
        INSERT INTO programs (name, description)
        VALUES (%s, %s)
        RETURNING id
        """,
        (f"Test Program {unique}", "Business-rule test data"),
    ).fetchone()["id"]

    # Two cohorts belonging to the same program
    cohort1 = db.execute(
        """
        INSERT INTO cohorts (program_id, name, start_date, end_date)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """,
        (
            program_id,
            f"Test Cohort A {unique}",
            today - timedelta(days=30),
            today + timedelta(days=30),
        ),
    ).fetchone()["id"]

    cohort2 = db.execute(
        """
        INSERT INTO cohorts (program_id, name, start_date, end_date)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """,
        (
            program_id,
            f"Test Cohort B {unique}",
            today - timedelta(days=30),
            today + timedelta(days=30),
        ),
    ).fetchone()["id"]

    # Trainers
    trainer1 = db.execute(
        """
        INSERT INTO trainers (name)
        VALUES (%s)
        RETURNING id
        """,
        (f"Test Trainer A {unique}",),
    ).fetchone()["id"]

    trainer2 = db.execute(
        """
        INSERT INTO trainers (name)
        VALUES (%s)
        RETURNING id
        """,
        (f"Test Trainer B {unique}",),
    ).fetchone()["id"]

    # Assign one trainer to each cohort
    db.execute(
        """
        INSERT INTO cohort_trainers (cohort_id, trainer_id)
        VALUES (%s, %s), (%s, %s)
        """,
        (cohort1, trainer1, cohort2, trainer2),
    )

    # Trainees
    trainee1 = db.execute(
        """
        INSERT INTO trainees (name)
        VALUES (%s)
        RETURNING id
        """,
        (f"Test Trainee A {unique}",),
    ).fetchone()["id"]

    trainee2 = db.execute(
        """
        INSERT INTO trainees (name)
        VALUES (%s)
        RETURNING id
        """,
        (f"Test Trainee B {unique}",),
    ).fetchone()["id"]

    # Only trainee1 is enrolled in cohort1.
    # This lets us test rejection of trainee2's attendance.
    db.execute(
        """
        INSERT INTO enrollments (cohort_id, trainee_id)
        VALUES (%s, %s)
        """,
        (cohort1, trainee1),
    )

    # A class in the past, led by an assigned trainer
    class_id = db.execute(
        """
        INSERT INTO cohort_classes
            (cohort_id, trainer_id, class_date, topic)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """,
        (
            cohort1,
            trainer1,
            today - timedelta(days=1),
            "Test Class A",
        ),
    ).fetchone()["id"]

    return {
        "program_id": program_id,
        "cohort1": cohort1,
        "cohort2": cohort2,
        "trainer1": trainer1,
        "trainer2": trainer2,
        "trainee1": trainee1,
        "trainee2": trainee2,
        "class_id": class_id,
    }
