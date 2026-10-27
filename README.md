# SalonFlow

SalonFlow is a mobile-first, multi-tenant booking operations app for salons and
appointment businesses. It is built with Next.js App Router, TypeScript,
Tailwind CSS, PostgreSQL, Prisma, Auth.js, Stripe and durable Vercel Cron jobs.

The included UI uses representative demo data so it can be explored without
third-party credentials. The Prisma schema, booking rules, Auth.js
configuration, Stripe webhook and durable job worker provide the production
foundation.

## Run locally

Requirements: Node.js 24+, npm and PostgreSQL.

```powershell
Copy-Item .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Seeded owner credentials:

- Email: `owner@salonflow.local`
- Password: `SalonFlow123!`

Replace all example secrets before deploying. Set `DEMO_MODE=false` when
connecting protected dashboard routes to Auth.js session checks.

## Commands

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Architecture

- `src/app` — App Router pages and webhook/cron endpoints.
- `src/components` — accessible mobile-first interface.
- `src/lib/domain` — deterministic, testable booking and money rules.
- `src/server` — Prisma, tenant safeguards, notifications and integrations.
- `prisma/schema.prisma` — tenant-owned operational and financial model.
- `tests/unit` — cut-off, cancellation, credit, reschedule, ledger and reminder
  boundary coverage.

Every tenant-owned record carries `organisationId`. Server access should use the
helpers in `src/server/tenancy.ts`, and compound lookups must include the tenant.
Stripe metadata includes both `organisationId` and `bookingId`. Provider
webhooks must pass signature verification before their idempotent event record
is processed.

## Stripe local webhooks

Install and authenticate the Stripe CLI, then run:

```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the emitted signing secret to `STRIPE_WEBHOOK_SECRET`. The handler rejects
unsigned payloads and stores provider event IDs uniquely before processing.

## Twilio and Meta webhooks

Use a secure HTTPS tunnel such as ngrok for local callbacks. Configure Twilio
status callbacks and the Meta Messenger webhook against the tunneled URL.
Production handlers must verify Twilio signatures and Meta signatures before
dispatching to a channel adapter.

For Meta app review, request `pages_messaging`, provide screencasts of the PSID
linking flow and explain that reminders are transactional service messages.
Messages outside the 24-hour window must use an approved utility template or
fall back to SMS/email.

## Time, money and jobs

All timestamps are stored in UTC and rendered in the organisation timezone.
Money is stored as integer pence. Cron claims due jobs using
`FOR UPDATE SKIP LOCKED`, idempotency keys prevent duplicates, and exhausted
jobs move to `DEAD_LETTER`.

## Deployment

1. Create a PostgreSQL database with point-in-time recovery.
2. Add variables from `.env.example` to Vercel.
3. Run `prisma migrate deploy` as a release step.
4. Deploy the Next.js project and configure provider webhook URLs.
5. Confirm `/api/health` and invoke the cron endpoint with `CRON_SECRET`.
6. Enable Sentry and alert on failed webhooks and dead-letter jobs.

Bank details must be envelope-encrypted with a managed key before production.
Restrict provider secrets to server-only environment variables and use separate
credentials per environment.
