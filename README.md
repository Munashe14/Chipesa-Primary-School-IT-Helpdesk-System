# Chipesa Primary School IT Help Desk

A web-based IT ticketing system for reporting, assigning, and tracking technical support requests at Chipesa Primary School.

## Features

- Role-based access for staff, IT technicians, administrators, and management
- Ticket creation, assignment, comments, history, and status tracking
- Dashboards, reports, PDF and Excel exports
- Ticket attachments
- SQLite database, initialized automatically on first start

## Run locally

Requirements: Node.js 20 or newer.

1. Install dependencies:
   ```bash
   npm run install-all
   ```
2. Create `server/.env` with a JWT secret:
   ```env
   JWT_SECRET=replace-this-with-a-long-random-secret
   JWT_EXPIRE=7d
   ```
3. Start the frontend and API:
   ```bash
   npm run dev
   ```

Open `http://localhost:5173`. The server creates `database/helpdesk.sqlite` and seeds demonstration data on first startup. To run the production build locally, use `npm run build` followed by `npm start`; the server serves the frontend on the port in `PORT` (5000 by default).

## Run with Docker

Build the image from the project root:

```bash
docker build -t chipesa-helpdesk .
```

Run it with persistent storage for the SQLite database and uploads:

```bash
docker run -d --name chipesa-helpdesk -p 5000:5000 -e "JWT_SECRET=replace-this-with-a-long-random-secret" -v helpdesk-data:/data chipesa-helpdesk
```

Open `http://localhost:5000`. Keep the `helpdesk-data` volume to preserve the database and uploaded files when the container is replaced. Set a strong `JWT_SECRET` before starting the container.

## Deploy to Render

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint**, connect the repository, and apply the `render.yaml` configuration.
3. Render builds the frontend and starts the Express server. The Blueprint creates a persistent disk mounted at `/var/data`, storing the SQLite database and uploaded files there.
4. Open the deployed service URL. Sign in with one of the demonstration accounts below.

The Blueprint uses a Starter web service because Render's free web services do not support persistent disks. Without persistent storage, SQLite data and uploaded files can be lost when a free instance restarts or redeploys. The app binds to Render's `PORT` and generates a `JWT_SECRET` automatically.

### Demonstration accounts

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@chipesa.school.zw` | `Admin@123` |
| IT Technician | `technician@chipesa.school.zw` | `Tech@123` |
| Staff User | `staff@chipesa.school.zw` | `Staff@123` |
| School Management | `management@chipesa.school.zw` | `Manage@123` |

These are shared demonstration credentials. Change them or disable public registration before using the system with real information.

## Project layout

- `client/` — React and Vite frontend
- `server/` — Express API and SQLite database adapter
- `database/schema.sql` — SQLite schema
- `database/seed.sql` — demonstration data for a new database
- `render.yaml` — Render Blueprint configuration
