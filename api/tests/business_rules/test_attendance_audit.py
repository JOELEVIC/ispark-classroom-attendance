def test_attendance_records_who_and_when(db, setup_data):
    data = setup_data

    record = db.execute(
        """
        INSERT INTO attendance
            (class_id, cohort_id, trainee_id, status,
             recorded_by, last_changed_by)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING recorded_by, last_changed_by, created_at, updated_at
        """,
        (
            data["class_id"], data["cohort1"], data["trainee1"],
            "PRESENT", data["trainer1"], data["trainer1"],
        ),
    ).fetchone()

    assert record["recorded_by"] == data["trainer1"]
    assert record["last_changed_by"] == data["trainer1"]
    assert record["created_at"] is not None
    assert record["updated_at"] is not None


def test_status_corrections_are_logged_with_old_new_status_and_trainer(
    db, setup_data
):
    data = setup_data
    attendance_id = db.execute(
        """
        INSERT INTO attendance
            (class_id, cohort_id, trainee_id, status,
             recorded_by, last_changed_by)
        VALUES (%s, %s, %s, 'PRESENT', %s, %s)
        RETURNING id
        """,
        (
            data["class_id"],
            data["cohort1"],
            data["trainee1"],
            data["trainer1"],
            data["trainer1"],
        ),
    ).fetchone()["id"]

    db.execute(
        """
        UPDATE attendance
        SET status = 'LATE', last_changed_by = %s
        WHERE id = %s
        """,
        (data["trainer1"], attendance_id),
    )
    db.execute(
        """
        UPDATE attendance
        SET status = 'ABSENT', last_changed_by = %s
        WHERE id = %s
        """,
        (data["trainer1"], attendance_id),
    )
    db.execute(
        """
        UPDATE attendance
        SET status = 'ABSENT', last_changed_by = %s
        WHERE id = %s
        """,
        (data["trainer1"], attendance_id),
    )

    history = db.execute(
        """
        SELECT attendance_id, old_status, new_status, changed_by, changed_at
        FROM attendance_change_history
        WHERE attendance_id = %s
        ORDER BY id
        """,
        (attendance_id,),
    ).fetchall()

    assert len(history) == 2
    assert [
        (item["old_status"], item["new_status"]) for item in history
    ] == [("PRESENT", "LATE"), ("LATE", "ABSENT")]
    assert all(item["attendance_id"] == attendance_id for item in history)
    assert all(item["changed_by"] == data["trainer1"] for item in history)
    assert all(item["changed_at"] is not None for item in history)