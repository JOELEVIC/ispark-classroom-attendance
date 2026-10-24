from datetime import date

from app.repositories import cohort_class_repository


class FakeCursor:
    def __init__(self):
        self.query = ""
        self.parameters = ()
        self.inserted = []

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, query, parameters=()):
        self.query = query
        self.parameters = parameters
        if "INSERT INTO cohort_classes" in query:
            cohort_id, trainer_id, class_date, topic = parameters
            self.inserted.append(
                {
                    "id": len(self.inserted) + 1,
                    "cohort_id": cohort_id,
                    "trainer_id": trainer_id,
                    "class_date": class_date,
                    "topic": topic,
                }
            )

    def fetchone(self):
        if "SELECT is_finished" in self.query:
            return {"is_finished": False}
        if "FROM cohorts" in self.query:
            return {
                "start_date": date(2026, 1, 5),
                "end_date": date(2026, 1, 14),
            }
        if "INSERT INTO cohort_classes" in self.query:
            return self.inserted[-1]
        raise AssertionError(f"Unexpected fetchone query: {self.query}")

    def fetchall(self):
        if "FROM cohort_classes" in self.query:
            return [{"class_date": date(2026, 1, 7)}]
        raise AssertionError(f"Unexpected fetchall query: {self.query}")


class FakeConnection:
    def __init__(self, cursor):
        self.cursor_instance = cursor

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def cursor(self):
        return self.cursor_instance


def test_recurring_schedule_generates_selected_weekdays_and_skips_taken_dates(
    monkeypatch,
):
    cursor = FakeCursor()
    monkeypatch.setattr(
        cohort_class_repository,
        "get_db_connection",
        lambda: FakeConnection(cursor),
    )

    result = cohort_class_repository.create_repeating_classes(
        cohort_id=10,
        trainer_id=7,
        weekdays=[0, 2],
        topic="API Foundations",
    )

    assert result == {
        "created_count": 3,
        "skipped_dates": [date(2026, 1, 7)],
        "classes": [
            {
                "id": 1,
                "cohort_id": 10,
                "trainer_id": 7,
                "class_date": date(2026, 1, 5),
                "topic": "API Foundations",
            },
            {
                "id": 2,
                "cohort_id": 10,
                "trainer_id": 7,
                "class_date": date(2026, 1, 12),
                "topic": "API Foundations",
            },
            {
                "id": 3,
                "cohort_id": 10,
                "trainer_id": 7,
                "class_date": date(2026, 1, 14),
                "topic": "API Foundations",
            },
        ],
    }
