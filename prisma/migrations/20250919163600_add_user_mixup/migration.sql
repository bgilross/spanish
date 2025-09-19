-- Create UserMixup table for aggregated per-user mixup counts
CREATE TABLE IF NOT EXISTS "public"."UserMixup" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expected" TEXT NOT NULL,
  "wrong" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserMixup_pkey" PRIMARY KEY ("id")
);

-- Add foreign key to User (idempotent)
DO $$ BEGIN
  ALTER TABLE "public"."UserMixup"
    ADD CONSTRAINT "UserMixup_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Unique composite constraint (as index) matching Prisma @@unique name
CREATE UNIQUE INDEX IF NOT EXISTS "userId_expected_wrong" ON "public"."UserMixup" ("userId", "expected", "wrong");

-- Supporting index to speed queries by userId + expected
CREATE INDEX IF NOT EXISTS "UserMixup_userId_expected_idx" ON "public"."UserMixup" ("userId", "expected");
