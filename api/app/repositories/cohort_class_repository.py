from datetime import date

from app.db.connection import get_db_connection


def create_class(
    cohort_id: int,
    trainer_id: int,
    class_date: date,
    topic: str,
):
    query = """
        INSERT INTO cohort_classes (
            cohort_id, trainer_id, class_date, topic
        )
        VALUES (%s, %s, %s, %s)
        RETURNING id, cohort_id, trainer_id, class_date, topic;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                query, (cohort_id, trainer_id, class_date, topic)
            )
            return cur.fetchone()


def get_class_by_id(class_id: int):
    query = """
        SELECT id, cohort_id, trainer_id, class_date, topic
        FROM cohort_classes
        WHERE id = %s;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (class_id,))
            return cur.fetchone()


def get_classes_by_cohort(cohort_id: int):
    query = """
        SELECT id, cohort_id, trainer_id, class_date, topic
        FROM cohort_classes
        WHERE cohort_id = %s
        ORDER BY class_date, id;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (cohort_id,))
            return cur.fetchall()