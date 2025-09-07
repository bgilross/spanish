-- Add auth columns to existing User table
ALTER TABLE "public"."User"
  ADD COLUMN "name" TEXT NULL,
  ADD COLUMN "email" TEXT NULL,
  ADD COLUMN "emailVerified" TIMESTAMP(3) NULL;

-- Unique index for email (NULL-able allowed multiple nulls in Postgres so we use partial unique)
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_unique" ON "public"."User"("email") WHERE email IS NOT NULL;

-- Create Account table
CREATE TABLE "public"."Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- Create Session table
CREATE TABLE "public"."Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Create VerificationToken table
CREATE TABLE "public"."VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

-- Constraints & Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "public"."Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "public"."VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- FKs
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
