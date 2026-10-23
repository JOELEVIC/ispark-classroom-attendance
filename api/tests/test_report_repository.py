from app.repositories import report_repository


class FakeCursor:
    def __init__(self, rows):
        self.rows = rows
        self.parameters = None
        self.query = None

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, query, parameters):
        self.query = query
        self.parameters = parameters

    def fetchall(self):
        return self.rows

    def fetchone(self):
        return self.rows


class FakeConnection:
    def __init__(self, cursor):
        self.fake_cursor = cursor

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def cursor(self):
        return self.fake_cursor


def test_get_cohort_attendance_report_maps_count_fields(monkeypatch):
    cursor = FakeCursor(
        [
            {
                "trainee_id": 20,
                "trainee_name": "Sam Trainee",
                "present": 3,
                "absent": 1,
                "late": 1,
                "excused": 0,
                "attendance_rate": 80.0,
            }
        ]
    )
    monkeypatch.setattr(
        report_repository,
        "get_db_connection",
        lambda: FakeConnection(cursor),
    )

    result = report_repository.get_cohort_attendance_report(10)

    assert cursor.parameters == (10,)
    assert "LEFT JOIN attendance" in cursor.query
    assert result == [
        {
            "trainee_id": 20,
            "trainee_name": "Sam Trainee",
            "counts": {
                "present": 3,
                "absent": 1,
                "late": 1,
                "excused": 0,
            },
            "attendance_rate": 80.0,
        }
    ]


def test_get_class_attendance_summary_returns_counts_and_unmarked(monkeypatch):
    result = {
        "class_id": 30,
        "present": 2,
        "absent": 1,
        "late": 0,
        "excused": 0,
        "unmarked_trainees": [
            {"trainee_id": 21, "trainee_name": "Alex Student"}
        ],
    }
    cursor = FakeCursor(result)
    monkeypatch.setattr(
        report_repository,
        "get_db_connection",
        lambda: FakeConnection(cursor),
    )

    summary = report_repository.get_class_attendance_summary(30)

    assert cursor.parameters == (30,)
    assert "WHERE cc.id = %s" in cursor.query
    assert summary == result
