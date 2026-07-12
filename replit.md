# LendLoop

Community asset sharing & rental platform. Users list, discover, and rent community-owned assets (cameras, tools, sports gear, etc.) with negotiated pricing, reviews, and notifications.

## Stack
- **Frontend**: React + Vite + TanStack Router, in `lendloop-frontend/` (dev server on port 5000, workflow "Start application")
- **Backend**: Node.js + Express, in `lendloop-backend/` (port 3001, workflow "Backend API")
- **Database**: Supabase Postgres (external — not a Replit-managed DB). Backend talks to it via the Supabase service role key.
- **Auth**: JWT + bcrypt

## Running it
Both workflows are configured and start automatically:
- `Backend API`: `cd lendloop-backend && PORT=3001 npm start`
- `Start application`: `cd lendloop-frontend && npm run dev`

Backend env vars (set as Replit env vars/secrets, not committed): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secret), `JWT_SECRET` (secret, generated), `JWT_EXPIRES_IN`, `CLIENT_URL`, `NODE_ENV`.

Demo login credentials are in `README.md`.

## Notable behavior
- Rental contact/pickup-location visibility: the rental endpoints (`GET /api/rentals/history`, `GET /api/rentals/:id`) only include `owner_contact` / `borrower_contact` once a rental's status is `ACCEPTED`, `ACTIVE`, or `COMPLETED`. The borrower's version of the owner's contact includes `latitude`/`longitude` for a "open in Google Maps" link; the owner's version of the borrower's contact does not. See `CONTACT_LOCATION_IMPLEMENTATION.md` for details.
- Map features use Leaflet + OpenStreetMap, not the Google Maps JS API — no map API key is required for the interactive map/location picker.

## User preferences
(none recorded yet)
