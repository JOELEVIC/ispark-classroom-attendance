from app.repositories import trainee_repository


class FakeCursor:
    def __init__(self):
        self.queries = []
        self.parameters = []

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, query, parameters=()):
        self.queries.append(query)
        self.parameters.append(parameters)

    def fetchone(self):
        return {"total": 23}

    def fetchall(self):
        return [
            {
                "id": 4,
                "name": "Ada Trainee",
                "cohorts": ["API Foundations", "Web Development"],
            }
        ]


class FakeConnection:
    def __init__(self, cursor):
        self.cursor_instance = cursor

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def cursor(self):
        return self.cursor_instance


def test_search_trainees_applies_global_search_and_stable_pagination(monkeypatch):
    cursor = FakeCursor()
    monkeypatch.setattr(
        trainee_repository,
        "get_db_connection",
        lambda: FakeConnection(cursor),
    )

    result = trainee_repository.search_trainees("ada", page=3, page_size=10)

    assert result == {
        "items": [
            {
                "id": 4,
                "name": "Ada Trainee",
                "cohorts": ["API Foundations", "Web Development"],
            }
        ],
        "total": 23,
        "page": 3,
        "page_size": 10,
        "total_pages": 3,
    }
    assert cursor.parameters == [("ada",), ("ada", 10, 20)]
    assert "strpos(lower(name), lower(%s)) > 0" in cursor.queries[0]
    assert "LEFT JOIN enrollments" in cursor.queries[1]
    assert "array_agg(DISTINCT c.name ORDER BY c.name)" in cursor.queries[1]
    assert "ORDER BY t.name, t.id" in cursor.queries[1]
