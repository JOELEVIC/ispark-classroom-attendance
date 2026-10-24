import pytest

from app.repositories import attendance_repository


class FakeCursor:
    def __init__(self):
        self.parameters = None
        self.query = None
        self.class_assignment = {"id": 1}
        self.attendance_insert_count = 0
        self.fail_on_attendance_insert = None

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, query, parameters):
        self.query = query
        self.parameters = parameters
        if "INSERT INTO attendance" in query:
            self.attendance_insert_count += 1
            if self.attendance_insert_count == self.fail_on_attendance_insert:
                raise RuntimeError("Simulated attendance insert failure")

    def fetchone(self):
        if "FROM cohort_classes" in self.query:
            return self.class_assignment
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
        self.rolled_back = False

    def __enter__(self):
        return self

    def __exit__(self, exception_type, *_):
        self.rolled_back = exception_type is not None
        return False

    def cursor(self):
        return self.fake_cursor


def test_record_attendance_uses_database_status_values(monkeypatch):
    cursor = FakeCursor()
    connection = FakeConnection(cursor)
    monkeypatch.setattr(
        attendance_repository,
        "get_db_connection",
        lambda: connection,
    )

    result = attendance_repository.record_attendance_batch(
        class_id=1,
        cohort_id=2,
        records=[(3, "present")],
        trainer_id=4,
    )

    assert cursor.parameters == (1, 2, 3, "PRESENT", 4, 4)
    assert result == [{"status": "PRESENT"}]
    assert connection.rolled_back is False


def test_attendance_batch_rolls_back_when_a_record_fails(monkeypatch):
    cursor = FakeCursor()
    cursor.fail_on_attendance_insert = 2
    connection = FakeConnection(cursor)
    monkeypatch.setattr(
        attendance_repository,
        "get_db_connection",
        lambda: connection,
    )

    with pytest.raises(
        RuntimeError, match="Simulated attendance insert failure"
    ):
        attendance_repository.record_attendance_batch(
            class_id=1,
            cohort_id=2,
            records=[(3, "present"), (5, "absent")],
            trainer_id=4,
        )

    assert cursor.attendance_insert_count == 2
    assert connection.rolled_back is True


def test_record_attendance_rejects_trainer_not_assigned_to_class(monkeypatch):
    cursor = FakeCursor()
    cursor.class_assignment = None
    monkeypatch.setattr(
        attendance_repository,
        "get_db_connection",
        lambda: FakeConnection(cursor),
    )

    with pytest.raises(attendance_repository.TrainerNotAssignedToClassError):
        attendance_repository.record_attendance_batch(
            class_id=7,
            cohort_id=2,
            records=[(3, "present")],
            trainer_id=4,
        )

    assert "WHERE id = %s" in cursor.query
    assert "AND cohort_id = %s" in cursor.query
    assert "AND trainer_id = %s" in cursor.query
    assert cursor.parameters == (7, 2, 4)


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
