from datetime import date, timedelta


def test_trainee_histories_are_separate_by_cohort(db, setup_data):
    data = setup_data

    # # Assign the trainer before scheduling the class. ("cohort2" and "trainer2" have already been assigned )


    db.execute(
        """
        INSERT INTO enrollments (cohort_id, trainee_id)
        VALUES (%s, %s)
        """,
        (data["cohort2"], data["trainee1"]),
    )

    class2 = db.execute(
        """
        INSERT INTO cohort_classes
            (cohort_id, trainer_id, class_date, topic)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """,
        (
            data["cohort2"], data["trainer2"],
            date.today() - timedelta(days=1), "Second cohort class",
        ),
    ).fetchone()["id"]

    db.execute(
        """
        INSERT INTO attendance
            (class_id, cohort_id, trainee_id, status,
             recorded_by, last_changed_by)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            class2, data["cohort2"], data["trainee1"],
            "ABSENT", data["trainer2"], data["trainer2"],
        ),
    )

    # Record attendance in cohort 1.
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

    history1 = db.execute(
        """
        SELECT status FROM attendance
        WHERE cohort_id = %s AND trainee_id = %s
        """,
        (data["cohort1"], data["trainee1"]),
    ).fetchall()

    history2 = db.execute(
        """
        SELECT status FROM attendance
        WHERE cohort_id = %s AND trainee_id = %s
        """,
        (data["cohort2"], data["trainee1"]),
    ).fetchall()

    assert [r["status"] for r in history1] == ["PRESENT"]
    assert [r["status"] for r in history2] == ["ABSENT"]