# AI-Assisted Development Disclosure

This frontend was developed with AI assistance (Cursor) for Activity 3: AI-Assisted Frontend Framework Integration with an Existing REST API.

## What AI was used for

- Inspecting the existing Django REST API (urls, serializers, permissions, README)
- Planning the React architecture against Activity 3 requirements
- Generating reusable UI components, API service modules, auth context, and feature pages
- Generating Vitest tests and project documentation
- Updating minimal backend CORS settings for Vite port 5173

## What was manually reviewed

- Actual API endpoints and field names against backend source (no invented routes)
- Role names: `Administrator`, `Registrar/Staff`, `Instructor`, `Student`
- JWT login/logout/me/refresh flow
- Academic records using `GET /students/{id}/academic-record/` only
- Error response shape `{ error: { code, message, details } }`
- Pagination (`page`, `per_page`) and search/filter query parameters
- CORS origins for `http://localhost:5173`

## Changes made after AI generation

- Aligned student create payload with backend (`username`/`password` required on create)
- Used `PATCH` for deactivate (`status: INACTIVE`) plus hard `DELETE` with confirmation
- Role-gated navigation so Student users do not see the full Students directory
- Dashboard summary counts taken from live API `count` fields (not fake stats)

## What was tested

- `npm test` (unit/component tests with mocked API)
- `npm run lint` (Oxlint)
- `npm run build` (production build)
- Manual verification against the running Django API when available

## Accountability

The developer is expected to explain:

- Frontend → REST API → Django → MySQL
- JWT storage and Axios interceptors
- Why frontend role checks are UX-only
- How the API service layer separates UI from HTTP
