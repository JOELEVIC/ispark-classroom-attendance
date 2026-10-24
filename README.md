# iSpark Classroom Attendance

Angular, FastAPI, and PostgreSQL app for managing cohorts, classes, enrollment,
and attendance.

New to the setup or having trouble with a step? See the
[setup and troubleshooting guide](HELP.md).

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

### Install Python

Install Python 3.12 before creating the API virtual environment. The API
requires Python 3.10 or newer. On macOS with Homebrew:

```bash
brew install python@3.12
python3.12 --version
```

On Windows, install Python 3.12 from [python.org](https://www.python.org/downloads/)
or with WinGet, then confirm the Python launcher can find it:

```powershell
winget install --id Python.Python.3.12 --exact
py -3.12 --version
```

On Linux, install Python 3.12 and its `venv` package using your distribution's
package manager. Use the matching versioned command shown below.

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

   Run the commands for your operating system from the repository root.
   These commands recreate `.venv` so an old Python 3.9 environment is not
   reused.

   macOS or Linux with Python 3.12:
   ```bash
   set -e
   cd api
   python3.12 -c 'import sys; assert sys.version_info >= (3, 10), "Python 3.10+ required"; print(sys.version)'
   python3.12 -m venv --clear .venv
   source .venv/bin/activate
   python -c 'import sys; assert sys.version_info >= (3, 10), "Python 3.10+ required"; print(sys.version)'
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

   Windows PowerShell with Python 3.12:
   ```powershell
   cd api
   py -3.12 -c "import sys; assert sys.version_info >= (3, 10), 'Python 3.10+ required'; print(sys.version)"
   py -3.12 -m venv --clear .venv
   .\.venv\Scripts\Activate.ps1
   python -c "import sys; assert sys.version_info >= (3, 10), 'Python 3.10+ required'; print(sys.version)"
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

   Linux with Python 3.12:
   ```bash
   set -e
   cd api
   python3.12 -c 'import sys; assert sys.version_info >= (3, 10), "Python 3.10+ required"; print(sys.version)'
   python3.12 -m venv --clear .venv
   source .venv/bin/activate
   python -c 'import sys; assert sys.version_info >= (3, 10), "Python 3.10+ required"; print(sys.version)'
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

   Keep this terminal open while using the API. If a Python version check
   fails, install Python 3.10 or newer first. If PowerShell blocks virtual
   environment activation, use Command Prompt and activate with
   `.venv\Scripts\activate.bat`.

4. Start the web app in a **second terminal**. Run npm from the `web`
   directory, not `api`. Start the terminal at the repository root (the
   folder containing this README), then paste:

   ```bash
   cd web
   npm ci
   npm start
   ```

   If your second terminal opens in `api`, run `cd ..` first, then run the
   commands above. In Windows PowerShell or Command Prompt, use:

   ```powershell
   cd web
   npm ci
   npm start
   ```

   Open <http://localhost:4200>. The development proxy forwards API requests
   to the local FastAPI server. Keep both terminals open.

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
