from app.repositories import enrollment_repository


class FakeCursor:
    def __init__(self, state, transaction_id):
        self.state = state
        self.transaction_id = transaction_id
        self.query = ""
        self.parameters = ()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, query, parameters=()):
        self.query = query
        self.parameters = parameters
        self.state["queries"].append((self.transaction_id, query, parameters))

    def fetchone(self):
        if "SELECT is_finished" in self.query:
            return {"is_finished": False}
        if self.query.startswith("SELECT 1 FROM cohorts"):
            return {"exists": 1}
        if "FROM enrollments" in self.query and self.query.lstrip().startswith(
            "SELECT 1"
        ):
            _, trainee_id = self.parameters
            if trainee_id in self.state["enrolled_ids"]:
                return {"exists": 1}
            return None
        if "INSERT INTO trainees" in self.query:
            trainee_id = self.state["next_trainee_id"]
            self.state["next_trainee_id"] += 1
            self.state["trainees"].append(
                {"id": trainee_id, "name": self.parameters[0]}
            )
            return {"id": trainee_id}
        if "INSERT INTO enrollments" in self.query:
            _, trainee_id = self.parameters
            self.state["enrolled_ids"].add(trainee_id)
            return {"id": 20}
        raise AssertionError(f"Unexpected fetchone query: {self.query}")

    def fetchall(self):
        if "FROM trainees WHERE name = %s" in self.query:
            name = self.parameters[0]
            return [
                {"id": trainee["id"]}
                for trainee in self.state["trainees"]
                if trainee["name"] == name
            ]
        raise AssertionError(f"Unexpected fetchall query: {self.query}")


class FakeConnection:
    def __init__(self, state):
        self.transaction_id = len(state["connections"])
        self.cursor_instance = FakeCursor(state, self.transaction_id)
        self.state = state

    def __enter__(self):
        return self

    def __exit__(self, exc_type, *_):
        if exc_type is None:
            self.state["committed_transactions"].append(self.transaction_id)
        return False

    def cursor(self):
        return self.cursor_instance


def test_import_enrollments_reports_row_errors_and_enrolls_valid_names(
    monkeypatch,
):
    state = {
        "connections": [],
        "committed_transactions": [],
        "queries": [],
        "trainees": [
            {"id": 1, "name": "Ada Trainee"},
            {"id": 2, "name": "Bea Trainee"},
            {"id": 3, "name": "Ambiguous Trainee"},
            {"id": 4, "name": "Ambiguous Trainee"},
        ],
        "enrolled_ids": {1},
        "next_trainee_id": 5,
    }

    def connection_factory():
        connection = FakeConnection(state)
        state["connections"].append(connection)
        return connection

    monkeypatch.setattr(
        enrollment_repository,
        "get_db_connection",
        connection_factory,
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
        "imported_count": 2,
        "total_rows": 7,
        "failures": [
            {
                "row": 2,
                "name": "Ada Trainee",
                "reason": "Already enrolled in this cohort.",
            },
            {
                "row": 4,
                "name": "Bea Trainee",
                "reason": "Already enrolled in this cohort.",
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
    # The preflight and each valid row use separate transactions; successful
    # enrollment and trainee creation are committed before the next row.
    assert len(state["connections"]) == 6
    assert len(state["committed_transactions"]) == 6
    assert state["trainees"][-1] == {"id": 5, "name": "Unknown Trainee"}
    assert 5 in state["enrolled_ids"]
    trainee_insert_transaction = next(
        transaction_id
        for transaction_id, query, _parameters in state["queries"]
        if "INSERT INTO trainees" in query
    )
    enrollment_insert_transaction = next(
        transaction_id
        for transaction_id, query, parameters in state["queries"]
        if "INSERT INTO enrollments" in query
        and parameters == (10, 5)
    )
    assert trainee_insert_transaction == enrollment_insert_transaction
