# iSpark Classroom Attendance

A classroom attendance management system built with Angular, FastAPI, PostgreSQL,
and psycopg 3. The frontend uses the same-origin `/api` path; Angular's
development proxy forwards requests to FastAPI at `127.0.0.1:8000`.

## Prerequisites

- Python 3.10 or newer
- Node.js and npm
- PostgreSQL 17 (or a compatible PostgreSQL server) and the `psql` command-line
  tools

## Start from a fresh checkout

### 1. Start PostgreSQL and create the database

Start your local PostgreSQL service using the method for your operating system.
Create the application role and database, or use an existing role/database:

```bash
createuser -P ispark_dev_user
createdb -O ispark_dev_user ispark_attendance
```

Set the password when prompted. If the role or database already exists, skip
the corresponding command.

### 2. Configure and initialize the database

Copy the API environment template and set `DATABASE_URL` to the connection
string for your PostgreSQL instance. Keep the real `.env` file private; do not
commit credentials.

```bash
cp api/.env.example api/.env
```

Edit `api/.env`, then create the schema and populate it with sample data:

```bash
psql -h localhost -U ispark_dev_user -d ispark_attendance \
  -v ON_ERROR_STOP=1 -f api/sql/schema.sql
psql -h localhost -U ispark_dev_user -d ispark_attendance \
  -v ON_ERROR_STOP=1 -f api/sql/seed.sql
```

Run those commands from the repository root. If your shell is already in the
`api` directory, use `-f sql/schema.sql` and `-f sql/seed.sql` instead.

When applying schema updates to an existing database, rerun `schema.sql` before
starting the updated API. The schema script uses idempotent table/index creation
and recreates its trigger functions and triggers.

The seed script is safe to rerun. It creates or reuses two programs, three
cohorts, three trainers, and 15 trainees (one enrolled in two cohorts), plus
four classes per cohort and attendance records for those classes. It also
creates a sample correction history for Ava Johnson in the API Foundations
class. Existing attendance records are not overwritten; the sample correction
is recorded only if that attendance has no history yet, so rerunning the seed
does not duplicate it. The script does not delete unrelated database data.

### 3. Start the API

In a terminal, create the virtual environment, install dependencies, then start
the FastAPI development server:

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Run Python/API commands from inside `api` so Python can resolve the `app`
package.

The API health check is at <http://127.0.0.1:8000/health> and interactive API
documentation is at <http://127.0.0.1:8000/docs>.

### 4. Start the Angular frontend

In another terminal:

```bash
cd web
npm ci
npm start
```

Open <http://localhost:4200>. Requests to `/api` are forwarded to the API
server by `web/proxy.conf.json`; keep FastAPI running on port 8000 while using
the frontend.

## Tests and production build

The backend test suite uses pytest, included in `api/requirements.txt`. From the
repository root, activate the API virtual environment and run the full suite:

```bash
cd api
source .venv/bin/activate
python -m pytest
```

To run a specific backend test file, pass its path, for example:

```bash
python -m pytest tests/business_rules/test_attendance_audit.py
```

Run the Angular tests or build from the frontend directory:

```bash
cd web
npm test -- --watch=false
npm run build
```

## Attendance-rate policy

Attendance rate is calculated per trainee and cohort as:

```text
(Present + Late) / (Present + Absent + Late) * 100
```

Late counts as attended. Excused records are excluded from the denominator so
approved absences do not lower the trainee's rate. A trainee with no countable
attendance records has an N/A rate. Rates below 75% are flagged in the cohort
report.

## CSV report and enrollment tools

The Cohort Report page can download a CSV with one row per trainee, containing
their Present, Absent, Late, and Excused totals and attendance rate. Rates with
no countable attendance are exported as `N/A`.

The Enrollments page accepts a CSV with exactly one `name` column. Each name
must exactly match one existing trainee after surrounding whitespace is
trimmed; imports do not create trainees. Already-enrolled trainees, repeated
names, unknown or ambiguous names, blank names, and malformed rows are reported
with their CSV row number and reason. Uploads are limited to 1 MB and must use
UTF-8.

## Trainee search and pagination

The Trainees page searches names across the full trainee directory and shows
each trainee's cohort memberships. Results are loaded from the API ten at a
time, with a total count and Previous/Next page controls. The existing
`GET /trainees/` directory endpoint remains available to enrollment workflows;
the paginated search uses `GET /trainees/search?q=<name>&page=1&page_size=10`.

## Finished cohorts

From the Cohorts page, choose **Mark as finished** and confirm. A finished
cohort and its attendance, classes, enrollments, and trainer assignments are
preserved and remain viewable, but the cohort is read-only. Finished cohorts
are excluded from default cohort selectors. Use **Show finished cohorts** on
the Cohorts page or **Include finished cohorts** on Cohort Report to access
them. The API rejects further enrollment, trainer assignment, class scheduling,
and attendance changes for a finished cohort.

## Recurring class schedules

On the Classes page, choose **Repeating schedule**, enter a shared topic and
trainer, and select one or more weekdays. The API schedules a class for each
selected weekday from the cohort start date through its end date, inclusive.
Any date that already has a class is skipped and reported; holidays are not
automatically excluded.
