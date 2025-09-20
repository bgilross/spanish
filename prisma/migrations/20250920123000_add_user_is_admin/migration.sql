-- Add isAdmin column to User (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'isAdmin'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "isAdmin" boolean NOT NULL DEFAULT false;
    END IF;
EXCEPTION WHEN duplicate_column THEN
    -- ignore
END$$;

-- Create an index on isAdmin for quick queries (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'user_is_admin_idx'
    ) THEN
        CREATE INDEX user_is_admin_idx ON "User" ("isAdmin");
    END IF;
END$$;
