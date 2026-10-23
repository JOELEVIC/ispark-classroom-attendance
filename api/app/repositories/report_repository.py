from app.db.connection import get_db_connection


def get_cohort_attendance_report(cohort_id: int):
    query = """
        SELECT
            t.id AS trainee_id,
            t.name AS trainee_name,
            COUNT(a.id) FILTER (WHERE a.status = 'PRESENT')::int AS present,
            COUNT(a.id) FILTER (WHERE a.status = 'ABSENT')::int AS absent,
            COUNT(a.id) FILTER (WHERE a.status = 'LATE')::int AS late,
            COUNT(a.id) FILTER (WHERE a.status = 'EXCUSED')::int AS excused,
            CASE
                WHEN COUNT(a.id) FILTER (
                    WHERE a.status IN ('PRESENT', 'ABSENT', 'LATE')
                ) = 0 THEN NULL
                ELSE ROUND(
                    100.0 * (
                        COUNT(a.id) FILTER (
                            WHERE a.status IN ('PRESENT', 'LATE')
                        )
                    ) / (
                        COUNT(a.id) FILTER (
                            WHERE a.status IN ('PRESENT', 'ABSENT', 'LATE')
                        )
                    ),
                    2
                )
            END AS attendance_rate
        FROM enrollments AS e
        JOIN trainees AS t ON t.id = e.trainee_id
        LEFT JOIN attendance AS a
            ON a.trainee_id = e.trainee_id
           AND a.cohort_id = e.cohort_id
        WHERE e.cohort_id = %s
        GROUP BY t.id, t.name
        ORDER BY t.name, t.id;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (cohort_id,))
            records = cur.fetchall()

    return [
        {
            "trainee_id": record["trainee_id"],
            "trainee_name": record["trainee_name"],
            "counts": {
                "present": record["present"],
                "absent": record["absent"],
                "late": record["late"],
                "excused": record["excused"],
            },
            "attendance_rate": record["attendance_rate"],
        }
        for record in records
    ]


def get_class_attendance_summary(class_id: int):
    query = """
        SELECT
            cc.id AS class_id,
            COUNT(a.id) FILTER (WHERE a.status = 'PRESENT')::int AS present,
            COUNT(a.id) FILTER (WHERE a.status = 'ABSENT')::int AS absent,
            COUNT(a.id) FILTER (WHERE a.status = 'LATE')::int AS late,
            COUNT(a.id) FILTER (WHERE a.status = 'EXCUSED')::int AS excused,
            COALESCE(
                json_agg(
                    json_build_object(
                        'trainee_id', t.id,
                        'trainee_name', t.name
                    )
                    ORDER BY t.name, t.id
                ) FILTER (WHERE t.id IS NOT NULL AND a.id IS NULL),
                '[]'::json
            ) AS unmarked_trainees
        FROM cohort_classes AS cc
        LEFT JOIN enrollments AS e ON e.cohort_id = cc.cohort_id
        LEFT JOIN trainees AS t ON t.id = e.trainee_id
        LEFT JOIN attendance AS a
            ON a.class_id = cc.id
           AND a.trainee_id = e.trainee_id
        WHERE cc.id = %s
        GROUP BY cc.id;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (class_id,))
            return cur.fetchone()
