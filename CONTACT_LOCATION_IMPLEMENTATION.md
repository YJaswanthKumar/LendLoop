# Contact & Pickup Location After Rental Acceptance

## Objective
After a rental request is accepted (status `ACCEPTED`, `ACTIVE`, or `COMPLETED`), the owner and borrower can see each other's contact info. The borrower additionally sees the owner's pickup coordinates with a link to open them in Google Maps. Before acceptance, only public rental data is visible — no contact or location details.

## Existing API extended (no new endpoint)
No new endpoint was created. The existing rental endpoints already had a partial implementation from an earlier session; it was extended to include pickup coordinates:

- `GET /api/rentals/history` — `rentalController.getRentalHistory` → `rentalService.getRentalHistory`
- `GET /api/rentals/:id` — `rentalController.getRentalDetails` → `rentalService.getRentalDetails`

Both already call a shared `attachContacts()` helper in the rental service, which is the single place this logic lives.

## Backend files changed
- `lendloop-backend/src/services/rental.service.js`
  - `fetchContacts()` now also selects `latitude, longitude` from `users`.
  - Added `toOwnerContact()` / `toBorrowerContact()` shaping helpers:
    - **Owner contact** (shown to the borrower): `full_name, email, phone, city, state, latitude, longitude`.
    - **Borrower contact** (shown to the owner): `full_name, email, phone, city, state` — no coordinates, since there's no pickup location to share on the borrower's side.
  - `attachContacts()` still only attaches these fields when `status` is `ACCEPTED`, `ACTIVE`, or `COMPLETED` (`CONTACT_VISIBLE_STATUSES`, unchanged). For any other status, the rental object is returned as-is — no `owner_contact` / `borrower_contact` keys at all.

No database schema changes, no new tables, no changes to `rentals` or `users` table structure — `latitude`/`longitude` already existed on `users`.

## Frontend files changed
- `lendloop-frontend/src/utils/types.ts` — added `OwnerContact` / `BorrowerContact` interfaces and optional `owner_contact` / `borrower_contact` fields on `Rental`.
- `lendloop-frontend/src/components/RentalCard.tsx` — added a `ContactDetails` block shown only when the relevant contact object is present on the rental (i.e. only when the backend has decided to reveal it). Shows name, phone, email, city/state, and — for the borrower viewing the owner's contact — a "Open pickup location in Google Maps" link built as `https://www.google.com/maps?q=<latitude>,<longitude>` (opens in a new tab, no Google Maps API/key used).

This component is reused by both `_authenticated.requests.tsx` and `_authenticated.history.tsx`, so both pages automatically show the new contact/location block once a rental is accepted — no separate changes needed there.

## Security
- Access is restricted to rental participants only: `getRentalDetails` already calls `assertParticipant(rental, userId)`, which 403s anyone who isn't the rental's `owner_id` or `borrower_id`. `getRentalHistory` inherently only returns rentals scoped to `req.user.id`. Contact enrichment is applied after these checks, so nobody outside the rental can retrieve it.
- Visibility is also gated by status server-side (not just hidden in the UI) — the fields are absent from the JSON entirely pre-acceptance, not merely unrendered.

## How to test
1. Log in as two demo accounts (see `README.md` for credentials) that have a rental between them.
2. While the rental is `REQUESTED` or `NEGOTIATING`, confirm neither `owner_contact` nor `borrower_contact` appear in `GET /api/rentals/:id` or `/api/rentals/history`, and the Requests/History pages show no contact block.
3. Accept the rental. Re-fetch — the owner now receives `borrower_contact` (no coordinates) and the borrower receives `owner_contact` (including `latitude`/`longitude`). The Requests/History pages now render a contact card, and the borrower sees a "Open pickup location in Google Maps" link that opens `https://www.google.com/maps?q=<lat>,<lng>` in a new tab.
4. Confirm a third-party account (not owner/borrower) gets a 403 on `GET /api/rentals/:id` for that rental.

## How to deploy
No special steps — this is a backend + frontend code change with no schema migration. Deploy the backend and frontend as usual.

## Confirmation
- ✅ No database schema changes
- ✅ No new tables
- ✅ No authentication changes
- ✅ No unrelated API changes
- ✅ Existing functionality (create/counter/accept/reject/cancel/complete rentals, pagination, etc.) is unmodified
