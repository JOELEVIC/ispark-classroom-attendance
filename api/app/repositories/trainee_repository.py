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


def search_trainees(query: str, page: int, page_size: int):
    offset = (page - 1) * page_size
    search_query = """
        SELECT COUNT(*)::int AS total
        FROM trainees
        WHERE strpos(lower(name), lower(%s)) > 0;
    """
    page_query = """
        SELECT
            t.id,
            t.name,
            COALESCE(
                array_agg(DISTINCT c.name ORDER BY c.name)
                    FILTER (WHERE c.id IS NOT NULL),
                ARRAY[]::varchar[]
            ) AS cohorts
        FROM trainees AS t
        LEFT JOIN enrollments AS e ON e.trainee_id = t.id
        LEFT JOIN cohorts AS c ON c.id = e.cohort_id
        WHERE strpos(lower(t.name), lower(%s)) > 0
        GROUP BY t.id, t.name
        ORDER BY t.name, t.id
        LIMIT %s OFFSET %s;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(search_query, (query,))
            total = cur.fetchone()["total"]
            cur.execute(page_query, (query, page_size, offset))
            items = cur.fetchall()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }