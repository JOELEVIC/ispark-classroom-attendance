from app.db.connection import get_db_connection


def record_attendance(
    class_id: int,
    cohort_id: int,
    trainee_id: int,
    status: str,
    trainer_id: int,
):
    query = """
        INSERT INTO attendance (
            class_id,
            cohort_id,
            trainee_id,
            status,
            recorded_by,
            last_changed_by
        )
        VALUES (%s, %s, %s, %s, %s, %s)

        ON CONFLICT (class_id, trainee_id)
        DO UPDATE SET
            status = EXCLUDED.status,
            last_changed_by = EXCLUDED.last_changed_by

        RETURNING
            id,
            class_id,
            cohort_id,
            trainee_id,
            status,
            recorded_by,
            last_changed_by,
            created_at,
            updated_at;
    """

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                query,
                (
                    class_id,
                    cohort_id,
                    trainee_id,
                    status.upper(),
                    trainer_id,
                    trainer_id,
                ),
            )
            return cur.fetchone()


def get_attendance_by_class(class_id: int):
    query = """
        SELECT
            a.id,
            a.class_id,
            a.cohort_id,
            a.trainee_id,
            t.name AS trainee_name,
            a.status,
            a.recorded_by,
            a.last_changed_by,
            a.created_at,
            a.updated_at
        FROM attendance AS a
        JOIN trainees AS t ON t.id = a.trainee_id
        WHERE a.class_id = %s
        ORDER BY t.name, t.id;
    """

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (class_id,))
            return cur.fetchall()


def get_trainee_attendance_history(
    trainee_id: int,
    cohort_id: int,
):
    query = """
        SELECT
            a.id,
            a.trainee_id,
            a.cohort_id,
            a.class_id,
            cc.class_date,
            cc.topic,
            a.status
        FROM attendance AS a
        JOIN cohort_classes AS cc ON cc.id = a.class_id
        WHERE a.trainee_id = %s
          AND a.cohort_id = %s
        ORDER BY cc.class_date, cc.id;
    """

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (trainee_id, cohort_id))
            return cur.fetchall()