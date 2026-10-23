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