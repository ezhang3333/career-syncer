# Supabase Migrations

## Applying migrations

### Option A — Supabase CLI (recommended)

1. Install the CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```
2. Link your project (run once):
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```
3. Push all pending migrations:
   ```bash
   supabase db push
   ```

### Option B — Supabase dashboard SQL editor

1. Open your project at https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Copy the contents of `migrations/0001_initial_schema.sql`
4. Paste and click **Run**

## Migration files

| File | Description |
|------|-------------|
| `0001_initial_schema.sql` | Creates all Phase 1 tables, the `entity_type` enum, `updated_at` trigger function, and indexes |

## Notes

- Migrations are numbered sequentially (`0001_`, `0002_`, …). Always add new migrations as new files — never edit an already-applied file.
- The `set_updated_at` trigger function is created with `create or replace`, so re-running the file is safe for the function definition, but the `create table` statements will fail if the tables already exist. Run each migration only once.
