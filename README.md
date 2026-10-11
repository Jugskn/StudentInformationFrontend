# Student Information System — Frontend

React frontend for the university Student Information System. It integrates with the existing Django REST API and never connects directly to MySQL.

```
React (Vite)  →  HTTP/REST  →  Django REST Framework  →  MySQL
```

## Technology stack

- React 19
- Vite 8 (port **5173**)
- JavaScript
- Tailwind CSS 4
- React Router
- Axios
- Oxlint
- Vitest + Testing Library

## Prerequisites

- Node.js 20+ recommended
- The backend API running at `http://127.0.0.1:8000`
- Backend CORS must allow `http://localhost:5173` (configured in the API project)

## Installation

```powershell
cd D:\Development\StudentInformationFrontend
npm install
```

## Environment variables

Copy `.env.example` to `.env` if needed:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Only `VITE_*` variables are exposed to the browser. Never put MySQL credentials or Django secrets here.

## How to start the complete system

### 1. Start the backend

```powershell
cd D:\Development\StudentInformationAPI
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

- API base: `http://127.0.0.1:8000/api/v1/`
- Swagger: `http://127.0.0.1:8000/api/docs/`

### 2. Start the frontend

```powershell
cd D:\Development\StudentInformationFrontend
npm run dev
```

Open `http://localhost:5173`.

### Demo accounts (from backend seed)

| Username | Role | Password |
| --- | --- | --- |
| admin | Administrator | DemoPass123! *(reset if your local admin password differed)* |
| registrar01 | Registrar/Staff | DemoPass123! |
| instructor01 | Instructor | DemoPass123! |
| student_demo | Student | DemoPass123! |

If a seeded account already existed with a different password, the API seed does not overwrite it. Reset with Django’s `set_password` or create a fresh laboratory user.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 5173 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Oxlint |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest watch mode |

## Project structure

```
src/
  api/           Axios client + resource API modules
  components/    Reusable UI and layout pieces
  context/       Auth + toast providers
  hooks/         Shared data hooks
  layouts/       Authenticated app shell
  pages/         Feature pages by module
  routes/        Protected and role routes
  utils/         Errors, roles, storage, debounce
  test/          Test setup
```

## Authentication approach

1. `POST /api/v1/auth/login/` with `{ username, password }`
2. Store JWT `access` and `refresh` in `localStorage`
3. Attach `Authorization: Bearer <access>` on API requests
4. On 401, attempt `POST /api/v1/token/refresh/`
5. `GET /api/v1/auth/me/` loads roles and optional `student_id`
6. `POST /api/v1/auth/logout/` blacklists the refresh token
7. Unauthenticated users are redirected to `/login`

## API integration approach

UI components call functions in `src/api/*`. Those functions use a shared Axios instance (`src/api/axios.js`) pointed at `VITE_API_BASE_URL/api/v1`. No business rules are duplicated beyond UX validation; the Django API remains authoritative.

### Endpoints used

| Module | Paths |
| --- | --- |
| Auth | `/auth/login/`, `/auth/logout/`, `/auth/me/`, `/token/refresh/` |
| Students | `/students/` (+ create/update/delete) |
| Programs | `/programs/` |
| Courses | `/courses/` |
| Academic Terms | `/academic-terms/` |
| Course Offerings | `/course-offerings/` |
| Enrollments | `/enrollments/` |
| Grades | `/grades/` |
| Academic Records | `/students/{id}/academic-record/` |

Query parameters used where supported: `search`, filters (`program`, `status`, etc.), `ordering`/`sort`, `page`, `per_page`.

## Role-based UX

Frontend navigation and action buttons are filtered for usability. Backend permissions still enforce security.

| Role | Typical access |
| --- | --- |
| Administrator / Registrar/Staff | Full management of catalog, students, offerings, enrollments, grades |
| Instructor | View catalog/offerings/students in scope; manage assigned grades |
| Student | Own enrollments, grades, academic record |

HTTP 403 responses show an Access Denied interface.

## Error handling

Consistent mapping for 400/401/403/404/409/422/500 and network failures via `src/utils/errors.js`. Backend validation `details` are shown on forms when present.

## Testing

```powershell
npm test
npm run lint
npm run build
```

Tests cover login success/failure, protected routing, student loading/search/validation/confirmation, 403, and network errors.

## AI-assisted development disclosure

See [docs/AI_ASSISTED_DEVELOPMENT.md](docs/AI_ASSISTED_DEVELOPMENT.md).

## Architecture for defense

1. Browser React app talks only over HTTPS/HTTP REST.
2. Django authenticates JWT and authorizes by group roles.
3. Django ORM reads/writes MySQL.
4. Academic records are **computed** by the API from enrollments and grades (no separate AcademicRecord table).
