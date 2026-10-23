

-- Tables and relations creation script for fresh database

-- TABLES

CREATE TABLE IF NOT EXISTS programs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 150),
    description VARCHAR(2000)
):

CREATE TABLE IF NOT EXISTS cohorts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL CHECK (char_lenght(trim(name)) BETWEEN 2 AND 150),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT cohorts_end_date_constraint CHECK (end_date > start_date),
    CONSTRAINT cohorts_unique_name_per_program UNIQUE (program_id, name),
    CONSTRAINT cohorts_id_program_id_unique UNIQUE (id, program_id)
);

CREATE TABLE IF NOT EXISTS trainers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) CHECK (char_lenght(trim(name)) BETWEEN 2 AND 150),
);

CREATE TABLE IF NOT EXISTS trainees (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) CHECK (char_lenght(trim(name)) BETWEEN 2 AND 150)
);

CREATE TABLE IF NOT EXISTS cohort_trainers (
    cohort_id BIGINT NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
    trainer_id BIGINT NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
    PRIMARY KEY (cohort_id, trainer_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
    id BIGINT ALWAYS GENERATED AS IDENTITY PRIMARY KEY,
    trainee_id BIGINT NOT NULL REFERENCES trainees(id) ON DELETE RESTRICT,
    cohort_id BIGINT NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT enrollments_trainee_cohort_unique UNIQUE (trainee_id, cohort_id),
    CONSTRAINT enrollments_trainee_cohort_enrollment_id_unique UNIQUE (trainee_id, cohort_id, id)
);

CREATE TABLE IF NOT EXISTS cohort_classes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cohort_id BIGINT NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
    trainer_id BIGINT NOT NULL REFERENCES trainers(id),
    class_date TIMESTAMP NOT NULL,
    topic VARCHAR(200) NOT NULL CHECK (char_lentgh(trim(topic)) BETWEEN 1 AND 200),
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
    status VARCHAR(10) CHECK (status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
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

-- CROSS TABLE RULES

