from typing import TypedDict

from app.db.connection import get_db_connection
from app.repositories.cohort_repository import lock_active_cohort


class EnrollmentImportRow(TypedDict):
    row: int
    name: str
    error: str | None


class EnrollmentImportFailure(TypedDict):
    row: int
    name: str
    reason: str


class EnrollmentImportResult(TypedDict):
    imported_count: int
    total_rows: int
    failures: list[EnrollmentImportFailure]


def enroll_trainee(cohort_id: int, trainee_id: int):
    query = """
        INSERT INTO enrollments (cohort_id, trainee_id)
        VALUES (%s, %s)
        RETURNING id, cohort_id, trainee_id, enrolled_at;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            lock_active_cohort(cur, cohort_id)
            cur.execute(query, (cohort_id, trainee_id))
            return cur.fetchone()


def get_enrollments_by_cohort(cohort_id: int):
    query = """
        SELECT
            e.id,
            e.cohort_id,
            e.trainee_id,
            e.enrolled_at,
            t.name AS trainee_name
        FROM enrollments AS e
        JOIN trainees AS t ON t.id = e.trainee_id
        WHERE e.cohort_id = %s
        ORDER BY t.name, t.id;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (cohort_id,))
            return cur.fetchall()


def get_trainee_enrollments(trainee_id: int):
    query = """
        SELECT e.id, e.trainee_id, e.cohort_id, e.enrolled_at
        FROM enrollments AS e
        WHERE e.trainee_id = %s
        ORDER BY e.enrolled_at;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (trainee_id,))
            return cur.fetchall()


def import_enrollments_by_name(
    cohort_id: int, rows: list[EnrollmentImportRow]
) -> EnrollmentImportResult:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            lock_active_cohort(cur, cohort_id)

    failures: list[EnrollmentImportFailure] = []
    imported_count = 0
    for row in rows:
        name = row["name"]
        reason = row.get("error")
        if not reason and not name:
            reason = "Name is required."

        if not reason:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    lock_active_cohort(cur, cohort_id)
                    cur.execute(
                        "SELECT id FROM trainees WHERE name = %s",
                        (name,),
                    )
                    matches = cur.fetchall()

                    if len(matches) > 1:
                        reason = "More than one trainee has this exact name."
                    else:
                        if matches:
                            trainee_id = matches[0]["id"]
                        else:
                            cur.execute(
                                """
                                INSERT INTO trainees (name)
                                VALUES (%s)
                                RETURNING id
                                """,
                                (name,),
                            )
                            trainee_id = cur.fetchone()["id"]

                        cur.execute(
                            """
                            SELECT 1
                            FROM enrollments
                            WHERE cohort_id = %s AND trainee_id = %s
                            """,
                            (cohort_id, trainee_id),
                        )
                        if cur.fetchone():
                            reason = "Already enrolled in this cohort."
                        else:
                            cur.execute(
                                """
                                INSERT INTO enrollments (cohort_id, trainee_id)
                                VALUES (%s, %s)
                                ON CONFLICT ON CONSTRAINT
                                    enrollments_trainee_cohort_unique
                                    DO NOTHING
                                RETURNING id
                                """,
                                (cohort_id, trainee_id),
                            )
                            if cur.fetchone() is None:
                                reason = "Already enrolled in this cohort."
                            else:
                                imported_count += 1

        if reason:
            failures.append(
                {
                    "row": row["row"],
                    "name": name,
                    "reason": reason,
                }
            )

    return {
        "imported_count": imported_count,
        "total_rows": len(rows),
        "failures": failures,
    }