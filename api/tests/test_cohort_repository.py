from datetime import date

import pytest

from app.repositories import cohort_repository


class FakeCursor:
    def __init__(self):
        self.query = ""
        self.parameters = ()

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
        return {"id": 1, "name": "Cohort A"}

    def fetchall(self):
        return [{"id": 1, "name": "Cohort A"}]


class FakeConnection:
    def __init__(self, cursor):
        self.fake_cursor = cursor

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def cursor(self):
        return self.fake_cursor


@pytest.mark.parametrize(
    ("method", "arguments", "table", "parameters"),
    [
        (
            cohort_repository.create_cohort,
            (2, "Cohort A", date(2026, 1, 1), date(2026, 6, 30)),
            "INSERT INTO cohorts",
            (2, "Cohort A", date(2026, 1, 1), date(2026, 6, 30)),
        ),
        (cohort_repository.get_cohort_by_id, (3,), "FROM cohorts", (3,)),
        (
            cohort_repository.get_cohorts_by_program,
            (2,),
            "WHERE program_id = %s",
            (2, False),
        ),
        (
            cohort_repository.assign_trainer,
            (3, 4),
            "INSERT INTO cohort_trainers",
            (3, 4),
        ),
        (
            cohort_repository.get_cohort_trainers,
            (3,),
            "JOIN trainers",
            (3,),
        ),
    ],
)
def test_cohort_repository_uses_cohort_queries(
    monkeypatch, method, arguments, table, parameters
):
    cursor = FakeCursor()
    monkeypatch.setattr(
        cohort_repository,
        "get_db_connection",
        lambda: FakeConnection(cursor),
    )

    result = method(*arguments)

    assert table in cursor.query
    assert cursor.parameters == parameters
    expected_result = (
        [{"id": 1, "name": "Cohort A"}]
        if method
        in (
            cohort_repository.get_cohorts_by_program,
            cohort_repository.get_cohort_trainers,
        )
        else {"id": 1, "name": "Cohort A"}
    )
    assert result == expected_result


def test_lock_active_cohort_rejects_finished_cohorts():
    class FinishedCursor:
        def execute(self, query, parameters):
            assert "FOR UPDATE" in query
            assert parameters == (10,)

        def fetchone(self):
            return {"is_finished": True}

    with pytest.raises(cohort_repository.CohortFinishedError):
        cohort_repository.lock_active_cohort(FinishedCursor(), 10)


def test_lock_active_cohort_rejects_missing_cohorts():
    class MissingCursor:
        def execute(self, query, parameters):
            assert "FOR UPDATE" in query

        def fetchone(self):
            return None

    with pytest.raises(cohort_repository.CohortNotFoundError):
        cohort_repository.lock_active_cohort(MissingCursor(), 10)
