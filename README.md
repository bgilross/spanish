This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Local Development (Database + Auth)

The app persists lesson attempt summaries and authentication state in Postgres via Prisma + NextAuth.

### Database Setup & Migrations (Recommended Flow)

This repo uses Prisma Migrate. Use the following workflows to keep your database in sync across environments.

- New environment (local or CI/prod):

  - Apply checked-in migrations only:
    ```bash
    npx prisma migrate deploy
    npx prisma generate
    ```
  - Verify status:
    ```bash
    npx prisma migrate status
    ```

- Active local development (you are changing the schema):

  - Create a new migration and apply it to your dev DB:
    ```bash
    npx prisma migrate dev --name <feature_or_change>
    ```
  - Commit the generated folder under `prisma/migrations/<timestamp>_<name>/`.

- When migrate dev fails due to shadow DB conflicts (P3006):

  - Prefer to resolve locally via reset if you can afford data loss:
    ```bash
    npx prisma migrate reset   # DANGER: wipes local DB
    ```
  - If you cannot reset and only need to reconcile schema (e.g., shared dev DB), use:
    ```bash
    npx prisma db push
    npx prisma generate
    ```
    Then create a proper migration afterwards (in a clean environment) to capture changes for others.

- Quick verification commands:

  ```bash
  # Confirm table existence (psql example)
  psql "$DATABASE_URL" -c "\d+ \"UserMixup\""

  # Check Prisma sees no pending migrations
  npx prisma migrate status
  ```

Notes:

- Production and CI should always run `npx prisma migrate deploy` on startup/deploy.
- `db push` is fine to unblock local development but does not create a migration; don’t use it in production.
- Adding new tables or constraints locally? Create a migration with `migrate dev` and commit it.

### 1. Copy environment file

```
cp .env.example .env
```

Fill in:

- `DATABASE_URL` (see Docker option below)
- `NEXTAUTH_SECRET` (generate: `openssl rand -hex 32` or any long random string)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (Google Cloud Console OAuth credentials; Authorized origin `http://localhost:3000`, redirect `http://localhost:3000/api/auth/callback/google`)

### 2. Start a local Postgres (Docker)

If you have Docker installed you can run a throwaway DB:

```
docker run --name spanish-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=spanish_dev -p 5432:5432 -d postgres:16
```

Confirm connection (optional):

```
docker exec -it spanish-postgres psql -U postgres -d spanish_dev -c "\dt"
```

### 3. Install deps & generate Prisma Client

```
npm install
npx prisma migrate deploy   # applies existing migrations
npx prisma generate         # (normally run automatically via postinstall)
```

If you edit the schema locally and want a new migration (dev only):

```
npx prisma migrate dev --name some_change
```

### 4. Run the dev server

```
npm run dev
```

Navigate to `http://localhost:3000`.

### 4b. Local Testing Without Google Sign-In

If you don't want to configure Google OAuth immediately, set a fake user id in `.env`:

```
DEV_FAKE_USER_ID=dev-test-user
```

The app (in development only) will treat this as the signed-in user for saving lesson attempts. A small banner will show the active fallback id. Remove it or sign in with Google to use real accounts.

### 5. Google OAuth Setup Tips

In Google Cloud Console > Credentials:

- Application type: Web
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### 6. Troubleshooting

| Symptom                        | Fix                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `P1001` (database unreachable) | Check container running; correct host/port in `DATABASE_URL`.                                                                                           |
| `Error: NEXTAUTH_SECRET`       | Provide a value in `.env`.                                                                                                                              |
| OAuth "redirect_uri_mismatch"  | Ensure redirect URI exactly matches in Google console.                                                                                                  |
| No attempts saved locally      | Confirm you are signed in; check API route logs in terminal.                                                                                            |
| Migration errors (shadow DB)   | Prefer `npx prisma migrate reset` (local only). If blocked by shared DB, use `npx prisma db push` to reconcile, then follow up with a proper migration. |
| P2021 (table does not exist)   | Ensure migrations were applied: `npx prisma migrate deploy`. For local-only fixes, `npx prisma db push` then `npx prisma generate`.                     |
| P3006 (shadow DB conflict)     | Run `npx prisma migrate reset` (local dev), or temporarily `npx prisma db push` and later generate a migration in a clean env.                          |

### 7. Switching between Local and Vercel

Keep your production variables only in the Vercel dashboard. Local `.env` should NOT be committed. Use `.env.example` as authoritative list.

---

## Production Hardening TODO

- Remove `allowDangerousEmailAccountLinking` in prod.
- Add rate limiting / input validation on API routes.
- Add monitoring for failed sign-in attempts.
- Add explicit Zod schemas for request payloads.
