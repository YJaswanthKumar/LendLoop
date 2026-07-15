# Phase 1 — Foundation, Cancellation Policy, Damage Deposit, Wishlist

Part of a larger roadmap (see the bottom of this file for what's next). This phase lays the database
foundation for every future feature and fully implements three of the ten requested features end to end.

## Database migration

`supabase/migrations/0001_foundation.sql` — run this first (see `supabase/migrations/README.md`). It adds:

- Everything Phase 1 needs: `assets.cancellation_policy`, `rentals.cancellation_policy` /
  `cancelled_by` / `cancellation_reason` / `refund_amount` / `cancelled_at`, `rentals.deposit_status` /
  `deposit_refund_amount` / `deposit_notes` / `deposit_resolved_at` / `deposit_resolved_by`, and the new
  `wishlists` table.
- Schema for every later phase too (`asset_images`, `availability_blocks`, `conversations`, `messages`,
  `disputes`, `dispute_messages`, admin flags on `users`/`assets`, `reviews.asset_id`) so this is the only
  migration you'll need to run before the rest of the roadmap lands — nothing here is used by Phase 1's
  code yet, it's just provisioned early.
- Every statement is additive and safe to re-run (`create table if not exists`, `add column if not
  exists`). Nothing is dropped, renamed, or has data removed.

**You need to run this migration against your Supabase project before the new features will work** — the
backend now reads/writes columns that don't exist until you do.

## What LendLoop doesn't do (important context for both features below)

There's no payment gateway wired into LendLoop — no Stripe/Razorpay integration exists anywhere in the
codebase. So "refund" and "deposit" here are **records and guidance**, not money movement: the platform
computes what the cancellation policy says should happen and shows it to both parties clearly, but they
settle up themselves (same as pickup/return already works today). This is called out in the UI so it's not
mistaken for automatic payment processing.

## 1. Cancellation Policy

- **Asset owners** choose Flexible / Moderate / Strict when listing (`AssetForm.tsx`), each with a plain-
  English refund ladder shown inline.
- The chosen policy is **snapshotted onto the rental** at request time (`rentals.cancellation_policy`), so
  if an owner edits their listing later, rentals already in flight keep the terms the borrower agreed to.
- `utils/constants.js` → `CANCELLATION_REFUND_RULES` defines the ladder per policy (days-before-pickup →
  refund %). `utils/helpers.js` → `calculateCancellationRefund()` applies it. The frontend has a mirrored,
  pure-JS copy in `utils/cancellationPolicy.ts` (`estimateRefundPercent`) so the booking modal can preview
  the refund instantly without a round trip.
- **Owner-initiated cancellations always recommend a 100% refund**, regardless of policy or timing — the
  policy only limits what a *borrower* backing out is entitled to.
- Cancelling now goes through a confirmation modal (`CancelRentalModal.tsx`, used on both `/requests` and
  `/history`) that shows the computed refund and takes an optional reason, instead of firing instantly.
- `PATCH /api/rentals/:id/cancel` now accepts an optional `reason` in the body and returns `refund_amount`,
  `cancelled_by`, `cancellation_reason`, `cancelled_at` on the updated rental.

## 2. Damage Deposit lifecycle

Previously `security_deposit` was just a static number on the listing. It now has a real lifecycle on each
rental:

`NONE` → (deposit set on listing) `PENDING` → (booking accepted) `HELD` → (rental completes, owner decides)
`REFUNDED` / `PARTIALLY_REFUNDED` / `FORFEITED`

- If a rental is cancelled while a deposit is `HELD`, it's **automatically refunded** — the rental never
  happened, so there's nothing to hold it against.
- Once a rental is `COMPLETED` with a `HELD` deposit, the owner gets a **"Resolve security deposit"**
  action on their rental card, opening `DepositResolutionModal.tsx` to refund in full, refund partially
  (with an amount), or forfeit — with optional notes shown to the borrower. New endpoint:
  `PATCH /api/rentals/:id/deposit` (owner-only, `COMPLETED` rentals with a `HELD` deposit only).
  `resolveDeposit()` in `services/rental.service.js` enforces both checks server-side.
- Deposit status/amount/notes are now shown everywhere the brief asked for: the asset page, the booking
  modal, request cards, rental history, and (as `deposit_status`/`deposit_refund_amount`) available to the
  dashboard for a future earnings view.
- New shared components: `DepositBadge.tsx` (`DepositBadge` for a compact pill, `DepositSummary` for the
  fuller card used on `RentalCard`/asset detail).

## 3. Wishlist

- New table `wishlists` (`user_id`, `asset_id`, unique together).
- New backend resource: `services/wishlist.service.js`, `controllers/wishlist.controller.js`,
  `routes/wishlist.routes.js`, `validators/wishlist.validator.js`, mounted at `/api/wishlist`.
  - `GET /api/wishlist` — paginated, full asset objects.
  - `GET /api/wishlist/ids` — just the asset ids, fetched once after login so heart icons render instantly
    everywhere without a request per card.
  - `POST /api/wishlist` `{ assetId }` / `DELETE /api/wishlist/:assetId`.
  - Can't wishlist your own listing (400).
- New `WishlistContext` (`context/WishlistContext.tsx`) loads the id set once per session and exposes
  `isWishlisted()` / `toggle()` with **optimistic updates** — the heart flips instantly and only reverts if
  the request fails. This is the "real-time updates" behavior for wishlist: instant, client-side, and
  proportionate for a per-user list (no websocket infrastructure needed for this one, unlike messaging in a
  later phase, which does need it).
- New `WishlistButton.tsx` (heart icon) is wired into `AssetCard.tsx` (browse grid) and the asset detail
  page. Prompts login if used while logged out.
- New `/wishlist` page (`routes/_authenticated.wishlist.tsx`) with the same grid/empty/error/loading pattern
  as `/browse`.
- Navbar shows a heart icon with a live saved-count badge (desktop + mobile).

## Files changed

**Backend**
- `src/utils/constants.js` — `CANCELLATION_POLICY`, `CANCELLATION_REFUND_RULES`, `DEPOSIT_STATUS`, extra
  `NOTIFICATION_TYPE`s (`CANCELLED`, `DEPOSIT`, `WISHLIST`, `MESSAGE`, `DISPUTE` — the last two are for
  later phases, added now to avoid another migration-adjacent change).
- `src/utils/helpers.js` — `daysUntil`, `calculateCancellationRefund`.
- `src/services/asset.service.js` — `cancellationPolicy` on create/update.
- `src/validators/asset.validator.js` — validates `cancellationPolicy`.
- `src/services/rental.service.js` — policy snapshot + deposit `PENDING`/`HELD` transitions on
  create/accept; rewritten `cancelRental()`; new `resolveDeposit()`.
- `src/controllers/rental.controller.js`, `src/validators/rental.validator.js`,
  `src/routes/rental.routes.js` — cancel now takes `reason`; new deposit route.
- New: `src/services/wishlist.service.js`, `src/controllers/wishlist.controller.js`,
  `src/validators/wishlist.validator.js`, `src/routes/wishlist.routes.js`.
- `src/routes/index.js` — mounts `/api/wishlist`.

**Frontend**
- `src/utils/types.ts` — `CancellationPolicy`, `DepositStatus`, `WishlistItem`, new fields on `Asset` /
  `Rental`.
- `src/utils/cancellationPolicy.ts` — new, client-side refund ladder + labels/descriptions.
- `src/api/config.ts` — deposit + wishlist endpoints.
- `src/services/rentalService.ts` — `cancelRental(id, reason?)`, new `resolveDeposit()`.
- New: `src/services/wishlistService.ts`, `src/context/WishlistContext.tsx`,
  `src/components/WishlistButton.tsx`, `src/components/CancellationPolicyBadge.tsx`,
  `src/components/DepositBadge.tsx`, `src/components/CancelRentalModal.tsx`,
  `src/components/DepositResolutionModal.tsx`, `src/routes/_authenticated.wishlist.tsx`.
- `src/components/AssetForm.tsx` — cancellation policy picker.
- `src/components/AssetCard.tsx`, `src/routes/assets.$assetId.tsx` — wishlist heart, policy info, deposit
  display.
- `src/components/RentalCard.tsx` — policy badge, deposit summary, cancellation outcome, new
  `resolveDeposit` action.
- `src/routes/_authenticated.requests.tsx`, `src/routes/_authenticated.history.tsx` — cancel now opens
  `CancelRentalModal`; history also wires up `DepositResolutionModal`.
- `src/components/Navbar.tsx`, `src/routes/__root.tsx` — wishlist nav entry, `WishlistProvider`.

## How to run locally

1. Run the migration (see `supabase/migrations/README.md`).
2. `cd lendloop-backend && npm install && npm run dev` (or your existing start command).
3. `cd lendloop-frontend && npm install && npm run dev`.
   - `routeTree.gen.ts` is auto-generated by the TanStack Start Vite plugin — the new `/wishlist` route
     will be picked up automatically the first time you run `dev` or `build` after pulling these changes.
     You don't need to hand-edit it.

## Assumptions made

- No payment gateway exists, so deposit/refund amounts are recorded and displayed, not transacted. Flagging
  this clearly rather than quietly implying money moves automatically.
- "Real-time updates" for the wishlist means instant, optimistic client-side state (appropriate for a
  private per-user list) rather than websockets — reserving actual realtime infrastructure (Supabase
  Realtime) for the in-app messaging phase, where it's actually needed for a shared, live conversation.
- A rental can only ever have one deposit outcome (no partial-then-full-later sequence) — `resolveDeposit`
  is a one-time transition from `HELD`, matching how a real security-deposit conversation with someone
  actually plays out.

## What's next (not in this phase)

Reviews-everywhere + multiple photos, then availability calendar + owner earnings dashboard, then in-app
messaging, then dispute resolution + admin panel, then the Browse page redesign — see the roadmap discussed
in-conversation. The database migration above already provisions the tables all of these need.
