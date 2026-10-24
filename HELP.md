# Setup and troubleshooting guide

This guide explains the setup steps in the [README](README.md), including how
to start PostgreSQL when running the app without Docker. Run commands from the
repository root unless a step says otherwise.

## Before you start

Choose one of these ways to run PostgreSQL:

- **Docker Compose:** Docker runs PostgreSQL, the API, and the web app for you.
- **Without Docker:** Install PostgreSQL, then run the API and web app locally.

For local development, install PostgreSQL 17, Python 3.10 or newer, Node.js
and npm. Install Docker Desktop (Mac and Windows) or Docker Engine with the
Compose plugin (Linux) if you plan to use Compose.

Useful installation pages:

- [Docker Desktop](https://docs.docker.com/get-started/get-docker/)
- [PostgreSQL downloads](https://www.postgresql.org/download/)
- [Python downloads](https://www.python.org/downloads/)
- [Node.js downloads](https://nodejs.org/en/download)

After installing a command-line tool, open a new terminal so your shell picks
up the updated `PATH`. Check that commands are available:

```text
docker --version
docker compose version
psql --version
python3 --version
node --version
npm --version
```

On Windows, use `py --version` if `python3` is not available.

## Run with Docker Compose

### Configure credentials

From the repository root, copy the sample environment file:

macOS or Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Windows Command Prompt:

```bat
copy .env.example .env
```

Edit `.env` and replace the sample database password with a private
development password. Do not commit `.env` or share its contents. Compose
reads these settings when it starts.

### Start and stop the app

Run this from the repository root:

```bash
docker compose up --build
```

The first startup creates the database and loads the schema and sample data.
When the containers are ready, open <http://localhost>.

Stop the foreground command with `Ctrl+C`. You can also stop the stack from
another terminal with:

```bash
docker compose down
```

The database data is kept in a Docker volume when you run `docker compose
down`. The SQL initialization scripts only run when that database volume is
first created; changing the scripts will not automatically reinitialize an
existing database.

To see whether services are running and inspect their logs:

```bash
docker compose ps
docker compose logs
```

### Common Compose issues

- If Docker is not running, start Docker Desktop or the Docker Engine service,
  then retry `docker compose up --build`.
- If port 80 is already in use, stop the other service using it. The web
  container publishes port 80.
- The Compose database is available from your computer on port **5433** (the
  container itself uses 5432). This avoids colliding with a local PostgreSQL
  server. The app containers connect to the database internally.
- A database health-check failure usually means PostgreSQL did not start or
  its configuration is invalid. Check `docker compose logs db`.

## Run without Docker

### 1. Start PostgreSQL

PostgreSQL is a database server that runs as a background service; it may not
open a regular desktop app window. How you start it depends on how it was
installed.

#### macOS

If installed with Homebrew, first check which PostgreSQL formula is present:

```bash
brew services list
brew list --versions | grep postgresql
```

The project uses PostgreSQL 17. If `brew services list` shows that
`postgresql@17` is not installed but Homebrew lists another version, install
the project version first:

```bash
brew install postgresql@17
brew services start postgresql@17
```

If PostgreSQL 17 is already installed, you only need the second command. A
different installed version, such as `postgresql@15`, will not be started by
the `postgresql@17` command; Homebrew services must use the exact installed
formula name.

If you installed it using [Postgres.app](https://postgresapp.com/), open
Postgres.app and start the server there. Its command-line tools may need to be
added to your `PATH`; see the app's setup instructions.

#### Linux

On distributions using `systemd`, start the PostgreSQL service:

```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

To start it automatically after reboot:

```bash
sudo systemctl enable postgresql
```

Service names and initial database-user setup can vary by distribution. If
`postgresql` is not the service name, check your distribution's PostgreSQL
package instructions.

#### Windows

If installed with the official Windows installer, PostgreSQL normally runs as
a Windows service. Start the PostgreSQL service from **Services** (search for
“Services” in the Start menu), or use an elevated PowerShell terminal:

```powershell
Get-Service *postgres*
Start-Service postgresql-x64-17
```

The service name may differ if you installed another version. Use the name
shown by `Get-Service *postgres*`. If you installed PostgreSQL using a
different package manager, use that package manager's service controls.

#### Check the server

The application uses local port 5432 by default. Check that PostgreSQL is
accepting connections:

```bash
pg_isready -h localhost -p 5432
```

If the command is missing, the PostgreSQL command-line tools may not be
installed or may not be on your `PATH`. If it reports no response, confirm
that the service is running and listening on port 5432.

### 2. Create a database and user

The following commands create the development user and database. `createuser`
will prompt you to set a password:

```bash
createuser -P ispark_dev_user
createdb -h localhost -U ispark_dev_user -O ispark_dev_user ispark_attendance
```

If you already have a suitable PostgreSQL user and database, you can use
those instead and skip creating them. The user needs permission to connect to
the database and create/use the application tables.

If `createuser` or `createdb` cannot connect, check that PostgreSQL is
running. Some installations require an administrator account to create a
database role; use the administrative account configured during PostgreSQL
installation, for example by adding `-U postgres` to the command.

On Windows, run these commands in PowerShell or Command Prompt if PostgreSQL's
`bin` directory is on your `PATH`. Otherwise, run them using the full path to
the PostgreSQL installation's `bin` directory, or use the installed SQL Shell
(`psql`) to create the user and database.

### 3. Configure and initialize the API database

Copy the API environment template:

macOS or Linux:

```bash
cp api/.env.example api/.env
```

Windows PowerShell:

```powershell
Copy-Item api/.env.example api/.env
```

Windows Command Prompt:

```bat
copy api\.env.example api\.env
```

Edit `api/.env` and set `DATABASE_URL` to your PostgreSQL connection details.
For the example user and database above, the format is:

```text
DATABASE_URL=postgresql://ispark_dev_user:YOUR_PASSWORD@localhost:5432/ispark_attendance
```

Replace `YOUR_PASSWORD` with the password you chose. If your password
contains characters such as `@`, `:`, `/`, `#`, or `%`, URL-encode those
characters in the connection URL.

From the repository root, load the schema and sample data. You will be
prompted for the database user's password:

```bash
psql -h localhost -U ispark_dev_user -d ispark_attendance \
  -v ON_ERROR_STOP=1 -f api/sql/schema.sql
psql -h localhost -U ispark_dev_user -d ispark_attendance \
  -v ON_ERROR_STOP=1 -f api/sql/seed.sql
```

In PowerShell or Command Prompt, enter each command on a single line:

```text
psql -h localhost -U ispark_dev_user -d ispark_attendance -v ON_ERROR_STOP=1 -f api/sql/schema.sql
psql -h localhost -U ispark_dev_user -d ispark_attendance -v ON_ERROR_STOP=1 -f api/sql/seed.sql
```

If `psql` reports that the server is unavailable, return to the PostgreSQL
startup and connection check above. If it reports authentication failure,
check the username and password. If it says the database does not exist,
create it first or correct the database name in both the commands and
`DATABASE_URL`.

### 4. Install dependencies and start the API

Follow the copy-ready, operating-system-specific installation and startup
commands in the [README](README.md#run-without-docker). They
verify the Python version before installing dependencies and starting the
server.

If PowerShell prevents activation due to its execution policy, use Command
Prompt or follow Microsoft's instructions for the current user's script
execution policy.

Keep this terminal open while using the app. The API health endpoint is
<http://127.0.0.1:8000/health>. If startup reports a missing `DATABASE_URL`,
make sure `api/.env` exists and contains a valid connection URL.

If Uvicorn exits with `TypeError: unsupported operand type(s) for |` and the
traceback points into an API `.py` file, check `python --version` in the
activated environment. A Python 3.9 interpreter cannot run this project's
`str | None` type annotations. Install Python 3.10 or newer, recreate `.venv`
with that interpreter, activate it again, and reinstall the requirements.

### 5. Install dependencies and start the web app

Open a second terminal at the repository root (the directory containing this
guide), then run:

```bash
cd web
npm ci
npm start
```

Do not run `npm ci` from the `api` directory; npm looks for `package.json` in
the current directory, and the web app's `package.json` is in `web`. If the
second terminal opens in `api`, run `cd ..` before the commands above.

Open <http://localhost:4200>. The development proxy forwards API requests to
the local API on port 8000. Keep both the API and web terminals open.

If npm is not recognized, install Node.js and npm and open a new terminal.
If npm reports a Node.js version compatibility error, install a Node.js
version supported by the Angular CLI version in this project.

## Running tests

For backend tests, activate the API virtual environment, change to `api`, and
run:

```bash
python -m pytest
```

For frontend tests and a production build, change to `web` and run:

```bash
npm test -- --watch=false
npm run build
```

## Ports at a glance

| Service | Local development | Docker Compose |
| --- | --- | --- |
| Web app | `http://localhost:4200` | `http://localhost` (port 80) |
| API | `http://127.0.0.1:8000` | Internal to Compose |
| PostgreSQL | `localhost:5432` | `localhost:5433` from your computer |
