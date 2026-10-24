from app.repositories import attendance_repository


class FakeCursor:
    def __init__(self):
        self.parameters = None
        self.query = None

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, query, parameters):
        self.query = query
        self.parameters = parameters

    def fetchone(self):
        if "SELECT is_finished" in self.query:
            return {"is_finished": False}
        return {"status": self.parameters[3]}

    def fetchall(self):
        return [
            {
                "attendance_id": 5,
                "old_status": "PRESENT",
                "new_status": "LATE",
            }
        ]


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


def test_attendance_change_history_is_scoped_to_class_and_trainee(monkeypatch):
    cursor = FakeCursor()
    monkeypatch.setattr(
        attendance_repository,
        "get_db_connection",
        lambda: FakeConnection(cursor),
    )

    result = attendance_repository.get_attendance_change_history(7, 9)

    assert cursor.parameters == (7, 9)
    assert "WHERE a.class_id = %s" in cursor.query
    assert "AND a.trainee_id = %s" in cursor.query
    assert result == [
        {
            "attendance_id": 5,
            "old_status": "PRESENT",
            "new_status": "LATE",
        }
    ]
