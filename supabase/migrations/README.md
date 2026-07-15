# Database migrations

SQL migrations for LendLoop's Supabase Postgres database. Run them in order.

## How to run

**Option A — Supabase Dashboard (simplest)**
1. Open your project at https://app.supabase.com
2. Go to **SQL Editor**
3. Paste the contents of `0001_foundation.sql`
4. Click **Run**

**Option B — Supabase CLI**
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Migrations

| File | Adds |
|---|---|
| `0001_foundation.sql` | Cancellation policy, damage deposit lifecycle, wishlist, multiple photos (`asset_images`), review→asset linkage, availability calendar, in-app messaging (`conversations`/`messages` + Realtime), dispute resolution, admin flags |

Every statement in every migration is written to be **safe to re-run**: tables use `create table if not exists`, columns use `add column if not exists`, and data backfills check for existing rows first. Nothing here ever drops a table, drops a column, or renames anything you already have — it only adds.

## Notes

- Requires the `pgcrypto` extension for `gen_random_uuid()` — the migration enables it automatically.
- The messaging tables are added to Supabase's `supabase_realtime` publication so the frontend can subscribe to live message inserts. If you're running against a non-Supabase Postgres instance, that step is skipped automatically (no `supabase_realtime` publication exists there), and you'd need to wire up your own realtime/polling strategy.
- This migration is intentionally "run once, unlocks everything" — later feature phases build on these tables/columns without needing further schema changes.
