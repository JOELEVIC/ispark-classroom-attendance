# Web

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.4.

## API connection

Angular calls the API through `/api`. During local development, `ng serve`
uses `proxy.conf.json` to forward those requests to FastAPI at
`http://127.0.0.1:8000` and removes the `/api` prefix. Start FastAPI from the
`api` directory with:

```bash
uvicorn app.main:app --reload
```

Then start the frontend from this directory:

```bash
npm start
```

The app is available at `http://localhost:4200/`. The proxy keeps browser
requests same-origin, avoiding local CORS configuration.
Frontend code should use the relative `/api` base URL, not a hard-coded
`localhost:<port>` URL. After changing `proxy.conf.json` or its Angular serve
configuration, stop and restart `ng serve`; refreshing the page does not reload
the proxy configuration.

The production environment also uses `/api` as its base URL. Configure the
production web server or ingress to forward `/api/*` to the FastAPI service
while removing the `/api` prefix (for example, map `/api/programs/` to
`/programs/`). This keeps the API host out of the frontend bundle and avoids
cross-origin requests. Update `src/environments/environment.ts` if production
uses a different API base URL.

The Programs page uses FastAPI to list and create programs. The Trainees page
uses FastAPI to list and create trainees. The Cohorts page uses FastAPI for
cohort listing, creation, counts, trainer assignments, and trainee enrollments.
Other screens still use shared in-memory demo data.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
