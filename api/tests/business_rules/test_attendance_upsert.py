def test_resubmitting_attendance_updates_existing_record(db, setup_data):
    data = setup_data

    values = (
        data["class_id"], data["cohort1"], data["trainee1"],
        data["trainer1"],
    )

    first = db.execute(
        """
        INSERT INTO attendance
            (class_id, cohort_id, trainee_id, status,
             recorded_by, last_changed_by)
        VALUES (%s, %s, %s, 'PRESENT', %s, %s)
        RETURNING id
        """,
        (*values[:3], values[3], values[3]),
    ).fetchone()

    updated = db.execute(
        """
        INSERT INTO attendance
            (class_id, cohort_id, trainee_id, status,
             recorded_by, last_changed_by)
        VALUES (%s, %s, %s, 'LATE', %s, %s)
        ON CONFLICT (class_id, trainee_id)
        DO UPDATE SET
            status = EXCLUDED.status,
            last_changed_by = EXCLUDED.last_changed_by
        RETURNING id, status
        """,
        (*values[:3], values[3], values[3]),
    ).fetchone()

    count = db.execute(
        """
        SELECT COUNT(*) AS total
        FROM attendance
        WHERE class_id = %s AND trainee_id = %s
        """,
        (data["class_id"], data["trainee1"]),
    ).fetchone()["total"]

    assert updated["id"] == first["id"]
    assert updated["status"] == "LATE"
    assert count == 1