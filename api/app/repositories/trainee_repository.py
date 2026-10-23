from app.db.connection import get_db_connection


def create_trainee(name: str):
    query = """
        INSERT INTO trainees (name)
        VALUES (%s)
        RETURNING id, name;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (name,))
            return cur.fetchone()


def get_trainee_by_id(trainee_id: int):
    query = """
        SELECT id, name
        FROM trainees
        WHERE id = %s;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (trainee_id,))
            return cur.fetchone()


def get_trainees():
    query = "SELECT id, name FROM trainees ORDER BY name, id;"
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()