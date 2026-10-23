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

The seed script is safe to rerun. It creates or reuses two programs, three
cohorts, three trainers, and 15 trainees (one enrolled in two cohorts), plus
four classes per cohort and attendance records for those classes. It does not
delete unrelated database data.

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

Run the backend tests from the repository root:

```bash
cd api
source .venv/bin/activate
python -m pytest
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
