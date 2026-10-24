from datetime import date

from app.db.connection import get_db_connection


class CohortNotFoundError(Exception):
    pass


class CohortFinishedError(Exception):
    pass


def lock_active_cohort(cur, cohort_id: int) -> None:
    cur.execute(
        "SELECT is_finished FROM cohorts WHERE id = %s FOR UPDATE",
        (cohort_id,),
    )
    cohort = cur.fetchone()
    if cohort is None:
        raise CohortNotFoundError
    if cohort["is_finished"]:
        raise CohortFinishedError


def create_cohort(
    program_id: int,
    name: str,
    start_date: date,
    end_date: date,
):
    query = """
        INSERT INTO cohorts (program_id, name, start_date, end_date)
        VALUES (%s, %s, %s, %s)
        RETURNING id, program_id, name, start_date, end_date, is_finished;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (program_id, name, start_date, end_date))
            return cur.fetchone()


def get_cohort_by_id(cohort_id: int):
    query = """
        SELECT id, program_id, name, start_date, end_date, is_finished
        FROM cohorts
        WHERE id = %s;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (cohort_id,))
            return cur.fetchone()


def get_cohorts_by_program(program_id: int, include_finished: bool = False):
    query = """
        SELECT id, program_id, name, start_date, end_date, is_finished
        FROM cohorts
        WHERE program_id = %s
          AND (%s OR is_finished = FALSE)
        ORDER BY start_date, id;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (program_id, include_finished))
            return cur.fetchall()


def assign_trainer(cohort_id: int, trainer_id: int):
    query = """
        INSERT INTO cohort_trainers (cohort_id, trainer_id)
        VALUES (%s, %s)
        RETURNING cohort_id, trainer_id;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            lock_active_cohort(cur, cohort_id)
            cur.execute(query, (cohort_id, trainer_id))
            return cur.fetchone()


def finish_cohort(cohort_id: int):
    query = """
        UPDATE cohorts
        SET is_finished = TRUE
        WHERE id = %s
        RETURNING id, program_id, name, start_date, end_date, is_finished;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (cohort_id,))
            return cur.fetchone()


def get_cohort_trainers(cohort_id: int):
    query = """
        SELECT t.id, t.name
        FROM cohort_trainers AS ct
        JOIN trainers AS t ON t.id = ct.trainer_id
        WHERE ct.cohort_id = %s
        ORDER BY t.name, t.id;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (cohort_id,))
            return cur.fetchall()
