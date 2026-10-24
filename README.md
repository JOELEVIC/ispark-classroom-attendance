# iSpark Classroom Attendance

Angular, FastAPI, and PostgreSQL app for managing cohorts, classes, enrollment,
and attendance.

## Run with Docker Compose

Install Docker with Compose, then configure the database credentials in the
repository-root `.env` file before starting:

```bash
cp .env.example .env
```

Edit `.env` and replace the sample password. Keep `.env` private; it is ignored
by Git. Start the app from the repository root:

```bash
docker compose up --build
```

Open <http://localhost>. On first startup, Compose initializes the database
with the schema and sample data. Stop the services with `Ctrl+C`, or run
`docker compose down`; the database volume is preserved.

## Run without Docker

You need PostgreSQL 17, Python 3.10+, Node.js, and npm.

1. Start PostgreSQL, then create a database and user (or use existing ones):

   ```bash
   createuser -P ispark_dev_user
   createdb -O ispark_dev_user ispark_attendance
   ```

2. Configure and initialize the API database:

   ```bash
   cp api/.env.example api/.env
   ```

   Edit `api/.env` and set `DATABASE_URL` for your PostgreSQL user, password,
   host, and database. Then, from the repository root, run:

   ```bash
   psql -h localhost -U ispark_dev_user -d ispark_attendance \
     -v ON_ERROR_STOP=1 -f api/sql/schema.sql
   psql -h localhost -U ispark_dev_user -d ispark_attendance \
     -v ON_ERROR_STOP=1 -f api/sql/seed.sql
   ```

3. Start the API in one terminal:

   ```bash
   cd api
   python3 -m venv .venv
   source .venv/bin/activate
   python -m pip install -r requirements.txt
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. Start the web app in another terminal:

   ```bash
   cd web
   npm ci
   npm start
   ```

   Open <http://localhost:4200>. The development proxy forwards API requests to
   the local FastAPI server.

## Tests

Run backend tests from `api` with the virtual environment activated:

```bash
python -m pytest
```

Run frontend tests and build from `web`:

```bash
npm test -- --watch=false
npm run build
```
