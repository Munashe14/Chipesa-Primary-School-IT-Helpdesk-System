# Installation

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm run install-all` from the project root.
3. Create `server/.env` and set `JWT_SECRET` to a long, random value.
4. Run `npm run dev`, then open `http://localhost:5173`.

The API initializes `database/helpdesk.sqlite` and loads demonstration data on first startup. MySQL and XAMPP are not required.

## Render demonstration deployment

Push the repository to GitHub, then create a Render Blueprint from it. The included `render.yaml` builds and serves the frontend and API as one service and stores the SQLite database and uploads on a persistent disk. A paid Starter service is required for the disk; Render's free web services use ephemeral storage.

For the demo accounts and additional setup notes, see [README.md](./README.md).
