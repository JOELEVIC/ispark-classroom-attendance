def test_cohort_rosters_are_isolated(db, setup_data):
    data = setup_data

    roster_a = db.execute(
        "SELECT trainee_id FROM enrollments WHERE cohort_id = %s",
        (data["cohort1"],),
    ).fetchall()

    roster_b = db.execute(
        "SELECT trainee_id FROM enrollments WHERE cohort_id = %s",
        (data["cohort2"],),
    ).fetchall()

    assert [r["trainee_id"] for r in roster_a] == [data["trainee1"]]
    assert roster_b == []


