

-- Tables and relations creation script for fresh database

BEGIN;
-- TABLES

CREATE TABLE IF NOT EXISTS programs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 150),
    description VARCHAR(2000)
);

CREATE TABLE IF NOT EXISTS cohorts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 150),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT cohorts_end_date_constraint CHECK (end_date > start_date),
    CONSTRAINT cohorts_unique_name_per_program UNIQUE (program_id, name),
    CONSTRAINT cohorts_id_program_id_unique UNIQUE (id, program_id)
);

CREATE TABLE IF NOT EXISTS trainers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 150)
);

CREATE TABLE IF NOT EXISTS trainees (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 150)
);

CREATE TABLE IF NOT EXISTS cohort_trainers (
    cohort_id BIGINT NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
    trainer_id BIGINT NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
    PRIMARY KEY (cohort_id, trainer_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trainee_id BIGINT NOT NULL REFERENCES trainees(id) ON DELETE RESTRICT,
    cohort_id BIGINT NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT enrollments_trainee_cohort_unique UNIQUE (trainee_id, cohort_id)
);

CREATE TABLE IF NOT EXISTS cohort_classes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cohort_id BIGINT NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
    trainer_id BIGINT NOT NULL,
    class_date DATE NOT NULL,
    topic VARCHAR(200) NOT NULL CHECK (char_length(trim(topic)) BETWEEN 1 AND 200),
     CONSTRAINT cohort_classes_trainer_assignment_fk
        FOREIGN KEY (cohort_id, trainer_id)
        REFERENCES cohort_trainers(cohort_id, trainer_id)
        ON DELETE RESTRICT,
    CONSTRAINT cohort_classes_id_cohort_unique UNIQUE (id, cohort_id) 
);

CREATE TABLE IF NOT EXISTS attendance (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    class_id BIGINT NOT NULL,
    cohort_id BIGINT NOT NULL,
    trainee_id BIGINT NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
    recorded_by BIGINT NOT NULL,
    last_changed_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attendance_class_cohort_fk
        FOREIGN KEY (class_id, cohort_id)
        REFERENCES cohort_classes(id, cohort_id) ON DELETE RESTRICT,
    CONSTRAINT attendance_trainee_enrolled_fk
        FOREIGN KEY (trainee_id, cohort_id)
        REFERENCES enrollments(trainee_id, cohort_id) ON DELETE RESTRICT,
    CONSTRAINT attendance_recorded_by_trainer_fk
        FOREIGN KEY (cohort_id, recorded_by)
        REFERENCES cohort_trainers(cohort_id, trainer_id) ON DELETE RESTRICT,
    CONSTRAINT attendance_last_changed_by_trainer_fk
        FOREIGN KEY (cohort_id, last_changed_by)
        REFERENCES cohort_trainers(cohort_id, trainer_id) ON DELETE RESTRICT,
    CONSTRAINT attendance_one_record_per_trainee_per_class UNIQUE (class_id, trainee_id) 
);


-- INDEXES

CREATE INDEX IF NOT EXISTS idx_cohorts_program_id ON cohorts(program_id);
CREATE INDEX IF NOT EXISTS idx_cohort_trainers_trainer_id ON cohort_trainers(trainer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_classes_cohort_date ON cohort_classes(cohort_id, class_date);
CREATE INDEX IF NOT EXISTS idx_attendance_trainee_class ON attendance(trainee_id, class_id);


-- CROSS TABLE RULES

-- Rule 1: A class date must fall within its cohort's start and end dates.
CREATE OR REPLACE FUNCTION validate_cohort_class_dates()
RETURNS TRIGGER AS $$
DECLARE
    cohort_start DATE;
    cohort_end DATE;
BEGIN
    SELECT start_date, end_date
    INTO cohort_start, cohort_end
    FROM cohorts
    WHERE id = NEW.cohort_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cohort % does not exist', NEW.cohort_id;
    END IF;

    IF NEW.class_date < cohort_start
       OR NEW.class_date > cohort_end THEN
        RAISE EXCEPTION
            'Class date % must be between cohort dates % and %',
            NEW.class_date, cohort_start, cohort_end;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_validate_cohort_class_dates
ON cohort_classes;

CREATE TRIGGER trg_validate_cohort_class_dates
BEFORE INSERT OR UPDATE OF cohort_id, class_date
ON cohort_classes
FOR EACH ROW
EXECUTE FUNCTION validate_cohort_class_dates();


-- Rule 2: Attendance cannot be recorded for a future-dated class.
-- Also refresh updated_at whenever an attendance record is inserted or updated.
CREATE OR REPLACE FUNCTION validate_attendance_class_date()
RETURNS TRIGGER AS $$
DECLARE
    scheduled_date DATE;
BEGIN
    SELECT class_date
    INTO scheduled_date
    FROM cohort_classes
    WHERE id = NEW.class_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Class % does not exist', NEW.class_id;
    END IF;

    IF scheduled_date > CURRENT_DATE THEN
        RAISE EXCEPTION
            'Attendance cannot be recorded for future-dated class % (%).',
            NEW.class_id, scheduled_date;
    END IF;

    NEW.updated_at := CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_validate_attendance_class_date
ON attendance;

CREATE TRIGGER trg_validate_attendance_class_date
BEFORE INSERT OR UPDATE
ON attendance
FOR EACH ROW
EXECUTE FUNCTION validate_attendance_class_date();

COMMIT;