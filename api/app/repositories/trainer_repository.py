from app.db.connection import get_db_connection


def create_trainer(name: str):
    query = """
        INSERT INTO trainers (name)
        VALUES (%s)
        RETURNING id, name;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (name,))
            return cur.fetchone()


def get_trainer_by_id(trainer_id: int):
    query = """
        SELECT id, name
        FROM trainers
        WHERE id = %s;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (trainer_id,))
            return cur.fetchone()


def get_trainers():
    query = "SELECT id, name FROM trainers ORDER BY name, id;"
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()