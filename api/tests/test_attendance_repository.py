from app.repositories import attendance_repository


class FakeCursor:
    def __init__(self):
        self.parameters = None

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, _query, parameters):
        self.parameters = parameters

    def fetchone(self):
        return {"status": self.parameters[3]}


class FakeConnection:
    def __init__(self, cursor):
        self.fake_cursor = cursor

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def cursor(self):
        return self.fake_cursor


def test_record_attendance_uses_database_status_values(monkeypatch):
    cursor = FakeCursor()
    monkeypatch.setattr(
        attendance_repository,
        "get_db_connection",
        lambda: FakeConnection(cursor),
    )

    result = attendance_repository.record_attendance(
        class_id=1,
        cohort_id=2,
        trainee_id=3,
        status="present",
        trainer_id=4,
    )

    assert cursor.parameters == (1, 2, 3, "PRESENT", 4, 4)
    assert result == {"status": "PRESENT"}
