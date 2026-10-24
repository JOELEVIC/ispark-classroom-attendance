from datetime import date, timedelta

from app.db.connection import get_db_connection
from app.repositories.cohort_repository import (
    CohortNotFoundError,
    lock_active_cohort,
)


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
            lock_active_cohort(cur, cohort_id)
            cur.execute(
                query, (cohort_id, trainer_id, class_date, topic)
            )
            return cur.fetchone()


def create_repeating_classes(
    cohort_id: int,
    trainer_id: int,
    weekdays: list[int],
    topic: str,
):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            lock_active_cohort(cur, cohort_id)
            cur.execute(
                """
                SELECT start_date, end_date
                FROM cohorts
                WHERE id = %s
                """,
                (cohort_id,),
            )
            cohort = cur.fetchone()
            if cohort is None:
                raise CohortNotFoundError

            cur.execute(
                "SELECT class_date FROM cohort_classes WHERE cohort_id = %s",
                (cohort_id,),
            )
            occupied_dates = {row["class_date"] for row in cur.fetchall()}
            selected_weekdays = set(weekdays)
            classes = []
            skipped_dates = []
            class_date = cohort["start_date"]
            while class_date <= cohort["end_date"]:
                if class_date.weekday() in selected_weekdays:
                    if class_date in occupied_dates:
                        skipped_dates.append(class_date)
                    else:
                        cur.execute(
                            """
                            INSERT INTO cohort_classes (
                                cohort_id, trainer_id, class_date, topic
                            )
                            VALUES (%s, %s, %s, %s)
                            RETURNING id, cohort_id, trainer_id, class_date, topic
                            """,
                            (cohort_id, trainer_id, class_date, topic),
                        )
                        classes.append(cur.fetchone())
                class_date += timedelta(days=1)

            return {
                "created_count": len(classes),
                "skipped_dates": skipped_dates,
                "classes": classes,
            }


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