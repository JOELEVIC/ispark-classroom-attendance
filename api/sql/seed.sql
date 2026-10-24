-- Run after schema.sql, for example:
-- psql -h localhost -U ispark_dev_user -d ispark_attendance \
--   -v ON_ERROR_STOP=1 -f api/sql/seed.sql
--
-- This seed is safe to rerun. It keeps the named sample records, enrollments,
-- classes, and attendance without overwriting existing attendance records or
-- deleting other database data.

BEGIN;

DO $$
DECLARE
    backend_program_id BIGINT;
    frontend_program_id BIGINT;
    backend_cohort_3_id BIGINT;
    backend_cohort_4_id BIGINT;
    frontend_cohort_1_id BIGINT;
    jane_id BIGINT;
    samuel_id BIGINT;
    amara_id BIGINT;
    trainee_name TEXT;
    trainee_id BIGINT;
    class_row RECORD;
BEGIN
    SELECT id INTO backend_program_id
    FROM programs
    WHERE name = 'Backend Engineering'
    ORDER BY id
    LIMIT 1;
    IF backend_program_id IS NULL THEN
        INSERT INTO programs (name, description)
        VALUES (
            'Backend Engineering',
            'Build reliable APIs, services, and data-driven applications.'
        )
        RETURNING id INTO backend_program_id;
    END IF;

    SELECT id INTO frontend_program_id
    FROM programs
    WHERE name = 'Frontend Engineering'
    ORDER BY id
    LIMIT 1;
    IF frontend_program_id IS NULL THEN
        INSERT INTO programs (name, description)
        VALUES (
            'Frontend Engineering',
            'Design and build accessible, responsive web applications.'
        )
        RETURNING id INTO frontend_program_id;
    END IF;

    SELECT id INTO backend_cohort_3_id
    FROM cohorts
    WHERE program_id = backend_program_id
      AND name = 'Cohort 3'
    LIMIT 1;
    IF backend_cohort_3_id IS NULL THEN
        INSERT INTO cohorts (program_id, name, start_date, end_date)
        VALUES (
            backend_program_id, 'Cohort 3', DATE '2024-09-01', DATE '2025-01-31'
        )
        RETURNING id INTO backend_cohort_3_id;
    END IF;

    SELECT id INTO backend_cohort_4_id
    FROM cohorts
    WHERE program_id = backend_program_id
      AND name = 'Cohort 4'
    LIMIT 1;
    IF backend_cohort_4_id IS NULL THEN
        INSERT INTO cohorts (program_id, name, start_date, end_date)
        VALUES (
            backend_program_id, 'Cohort 4', DATE '2025-02-01', DATE '2025-06-30'
        )
        RETURNING id INTO backend_cohort_4_id;
    END IF;

    SELECT id INTO frontend_cohort_1_id
    FROM cohorts
    WHERE program_id = frontend_program_id
      AND name = 'Cohort 1'
    LIMIT 1;
    IF frontend_cohort_1_id IS NULL THEN
        INSERT INTO cohorts (program_id, name, start_date, end_date)
        VALUES (
            frontend_program_id, 'Cohort 1', DATE '2025-01-15', DATE '2025-05-31'
        )
        RETURNING id INTO frontend_cohort_1_id;
    END IF;

    SELECT id INTO jane_id
    FROM trainers
    WHERE name = 'Jane Mensah'
    ORDER BY id
    LIMIT 1;
    IF jane_id IS NULL THEN
        INSERT INTO trainers (name)
        VALUES ('Jane Mensah')
        RETURNING id INTO jane_id;
    END IF;

    SELECT id INTO samuel_id
    FROM trainers
    WHERE name = 'Samuel Okafor'
    ORDER BY id
    LIMIT 1;
    IF samuel_id IS NULL THEN
        INSERT INTO trainers (name)
        VALUES ('Samuel Okafor')
        RETURNING id INTO samuel_id;
    END IF;

    SELECT id INTO amara_id
    FROM trainers
    WHERE name = 'Amara Patel'
    ORDER BY id
    LIMIT 1;
    IF amara_id IS NULL THEN
        INSERT INTO trainers (name)
        VALUES ('Amara Patel')
        RETURNING id INTO amara_id;
    END IF;

    INSERT INTO cohort_trainers (cohort_id, trainer_id)
    VALUES
        (backend_cohort_3_id, jane_id),
        (backend_cohort_3_id, samuel_id),
        (backend_cohort_4_id, samuel_id),
        (backend_cohort_4_id, amara_id),
        (frontend_cohort_1_id, jane_id),
        (frontend_cohort_1_id, amara_id)
    ON CONFLICT (cohort_id, trainer_id) DO NOTHING;

    FOREACH trainee_name IN ARRAY ARRAY[
        'Ava Johnson',
        'Noah Williams',
        'Mia Brown',
        'Ethan Davis',
        'Zoe Wilson',
        'Liam Garcia',
        'Emma Martinez',
        'Oliver Anderson',
        'Sophia Thomas',
        'Lucas Taylor',
        'Isabella Moore',
        'Mason Jackson',
        'Harper Martin',
        'Elijah Lee',
        'Chloe Thompson'
    ] LOOP
        SELECT id INTO trainee_id
        FROM trainees
        WHERE name = trainee_name
        ORDER BY id
        LIMIT 1;
        IF trainee_id IS NULL THEN
            INSERT INTO trainees (name)
            VALUES (trainee_name)
            RETURNING id INTO trainee_id;
        END IF;
    END LOOP;

    INSERT INTO enrollments (cohort_id, trainee_id)
    SELECT backend_cohort_3_id, id
    FROM trainees
    WHERE name IN (
        'Ava Johnson', 'Noah Williams', 'Mia Brown',
        'Ethan Davis', 'Zoe Wilson'
    )
    ON CONFLICT ON CONSTRAINT enrollments_trainee_cohort_unique DO NOTHING;

    INSERT INTO enrollments (cohort_id, trainee_id)
    SELECT backend_cohort_4_id, id
    FROM trainees
    WHERE name IN (
        'Liam Garcia', 'Emma Martinez', 'Oliver Anderson',
        'Sophia Thomas', 'Lucas Taylor'
    )
    ON CONFLICT ON CONSTRAINT enrollments_trainee_cohort_unique DO NOTHING;

    INSERT INTO enrollments (cohort_id, trainee_id)
    SELECT frontend_cohort_1_id, id
    FROM trainees
    WHERE name IN (
        'Ava Johnson', 'Isabella Moore', 'Mason Jackson',
        'Harper Martin', 'Elijah Lee', 'Chloe Thompson'
    )
    ON CONFLICT ON CONSTRAINT enrollments_trainee_cohort_unique DO NOTHING;

    FOR class_row IN
        SELECT *
        FROM (VALUES
            (backend_cohort_3_id, jane_id, DATE '2024-09-10', 'API Foundations'),
            (backend_cohort_3_id, samuel_id, DATE '2024-10-01', 'Data Modeling'),
            (backend_cohort_3_id, jane_id, DATE '2024-11-05', 'RESTful Services'),
            (backend_cohort_3_id, samuel_id, DATE '2024-12-03', 'Testing APIs'),
            (backend_cohort_4_id, samuel_id, DATE '2025-02-11', 'Python Services'),
            (backend_cohort_4_id, amara_id, DATE '2025-03-11', 'SQL and Transactions'),
            (backend_cohort_4_id, samuel_id, DATE '2025-04-08', 'Authentication Design'),
            (backend_cohort_4_id, amara_id, DATE '2025-05-06', 'Deployment Workshop'),
            (frontend_cohort_1_id, jane_id, DATE '2025-01-21', 'HTML and Accessibility'),
            (frontend_cohort_1_id, amara_id, DATE '2025-02-18', 'CSS Layout'),
            (frontend_cohort_1_id, jane_id, DATE '2025-03-18', 'JavaScript Essentials'),
            (frontend_cohort_1_id, amara_id, DATE '2025-04-15', 'Frontend Project')
        ) AS seed_classes(cohort_id, trainer_id, class_date, topic)
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM cohort_classes
            WHERE cohort_id = class_row.cohort_id
              AND class_date = class_row.class_date
              AND topic = class_row.topic
        ) THEN
            INSERT INTO cohort_classes (
                cohort_id, trainer_id, class_date, topic
            )
            VALUES (
                class_row.cohort_id,
                class_row.trainer_id,
                class_row.class_date,
                class_row.topic
            );
        END IF;
    END LOOP;

    INSERT INTO attendance (
        class_id,
        cohort_id,
        trainee_id,
        status,
        recorded_by,
        last_changed_by
    )
    SELECT
        cc.id,
        cc.cohort_id,
        e.trainee_id,
        CASE
            WHEN cc.cohort_id = backend_cohort_3_id
             AND cc.topic = 'API Foundations'
             AND t.name = 'Ava Johnson'
                THEN 'PRESENT'
            ELSE CASE MOD(cc.id + e.trainee_id, 4)
                WHEN 0 THEN 'PRESENT'
                WHEN 1 THEN 'LATE'
                WHEN 2 THEN 'ABSENT'
                ELSE 'EXCUSED'
            END
        END,
        cc.trainer_id,
        cc.trainer_id
    FROM cohort_classes AS cc
    JOIN enrollments AS e ON e.cohort_id = cc.cohort_id
    JOIN trainees AS t ON t.id = e.trainee_id
    WHERE (
        (cc.cohort_id = backend_cohort_3_id
            AND cc.topic IN (
                'API Foundations', 'Data Modeling',
                'RESTful Services', 'Testing APIs'
            ))
        OR (cc.cohort_id = backend_cohort_4_id
            AND cc.topic IN (
                'Python Services', 'SQL and Transactions',
                'Authentication Design', 'Deployment Workshop'
            ))
        OR (cc.cohort_id = frontend_cohort_1_id
            AND cc.topic IN (
                'HTML and Accessibility', 'CSS Layout',
                'JavaScript Essentials', 'Frontend Project'
            ))
    )
    ON CONFLICT ON CONSTRAINT attendance_one_record_per_trainee_per_class
    DO NOTHING;

    UPDATE attendance AS a
    SET status = CASE
            WHEN a.status = 'LATE' THEN 'PRESENT'
            ELSE 'LATE'
        END,
        last_changed_by = cc.trainer_id
    FROM cohort_classes AS cc
    JOIN enrollments AS e ON e.cohort_id = cc.cohort_id
    JOIN trainees AS t ON t.id = e.trainee_id
    WHERE a.class_id = cc.id
      AND a.trainee_id = e.trainee_id
      AND cc.cohort_id = backend_cohort_3_id
      AND cc.topic = 'API Foundations'
      AND t.name = 'Ava Johnson'
      AND NOT EXISTS (
          SELECT 1
          FROM attendance_change_history AS history
          WHERE history.attendance_id = a.id
      );
END;
$$;

COMMIT;
