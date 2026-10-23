from app.db.connection import get_db_connection


def enroll_trainee(cohort_id: int, trainee_id: int):
    query = """
        INSERT INTO enrollments (cohort_id, trainee_id)
        VALUES (%s, %s)
        RETURNING id, cohort_id, trainee_id, enrolled_at;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
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