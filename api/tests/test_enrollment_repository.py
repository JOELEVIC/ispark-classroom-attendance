from app.repositories import enrollment_repository


class FakeCursor:
    def __init__(self):
        self.query = ""
        self.parameters = ()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, query, parameters=()):
        self.query = query
        self.parameters = parameters

    def fetchone(self):
        if "SELECT is_finished" in self.query:
            return {"is_finished": False}
        if self.query.startswith("SELECT 1 FROM cohorts"):
            return {"exists": 1}
        if "INSERT INTO enrollments" in self.query:
            return {"id": 20}
        raise AssertionError(f"Unexpected fetchone query: {self.query}")

    def fetchall(self):
        if "FROM trainees WHERE name = ANY" in self.query:
            return [
                {"id": 1, "name": "Ada Trainee"},
                {"id": 2, "name": "Bea Trainee"},
                {"id": 3, "name": "Ambiguous Trainee"},
                {"id": 4, "name": "Ambiguous Trainee"},
            ]
        if "FROM enrollments" in self.query:
            return [{"trainee_id": 1}]
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


def test_import_enrollments_reports_row_errors_and_enrolls_valid_names(
    monkeypatch,
):
    cursor = FakeCursor()
    monkeypatch.setattr(
        enrollment_repository,
        "get_db_connection",
        lambda: FakeConnection(cursor),
    )
    rows = [
        {"row": 2, "name": "Ada Trainee", "error": None},
        {"row": 3, "name": "Bea Trainee", "error": None},
        {"row": 4, "name": "Bea Trainee", "error": None},
        {"row": 5, "name": "Unknown Trainee", "error": None},
        {
            "row": 6,
            "name": "Ambiguous Trainee",
            "error": None,
        },
        {
            "row": 7,
            "name": "Extra Column",
            "error": "Row contains more columns than the header.",
        },
        {"row": 8, "name": "", "error": None},
    ]

    result = enrollment_repository.import_enrollments_by_name(10, rows)

    assert result == {
        "imported_count": 1,
        "total_rows": 7,
        "failures": [
            {
                "row": 2,
                "name": "Ada Trainee",
                "reason": "Trainee is already enrolled in this cohort.",
            },
            {
                "row": 4,
                "name": "Bea Trainee",
                "reason": "Duplicate name in this CSV.",
            },
            {
                "row": 5,
                "name": "Unknown Trainee",
                "reason": "No existing trainee has this exact name.",
            },
            {
                "row": 6,
                "name": "Ambiguous Trainee",
                "reason": "More than one trainee has this exact name.",
            },
            {
                "row": 7,
                "name": "Extra Column",
                "reason": "Row contains more columns than the header.",
            },
            {"row": 8, "name": "", "reason": "Name is required."},
        ],
    }
