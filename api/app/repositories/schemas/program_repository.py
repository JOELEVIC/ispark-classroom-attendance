from app.db.connection import get_db_connection


def create_program(name: str, description: str | None):
    query = """
        INSERT INTO programs (name, description)
        VALUES (%s, %s)
        RETURNING id, name, description;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (name, description))
            return cur.fetchone()


def get_program_by_id(program_id: int):
    query = """
        SELECT id, name, description
        FROM programs
        WHERE id = %s;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (program_id,))
            return cur.fetchone()


def get_programs():
    query = """
        SELECT id, name, description
        FROM programs
        ORDER BY id;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()