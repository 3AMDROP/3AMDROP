# Production Setup

This project is wired for a production auth + welcome email flow using Vercel, Supabase Auth, and Resend.

## What You Need

1. A Supabase project
2. A Resend account
3. A verified sending domain in Resend such as `hello@yourbrand.com`
4. A Vercel project for deployment
5. A Tap account with card / Benefit enabled for Bahrain

## Environment Variables

Add these in Vercel project settings:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
PUBLIC_APP_NAME=3AM Worldwide
TAP_SECRET_KEY=
APP_URL=
ADMIN_EMAILS=
```

## Supabase Notes

- Enable Email/Password auth in Supabase.
- The register endpoint creates users server-side with `email_confirm: true` so customers can sign in immediately after registering.
- If you want mandatory email confirmation later, switch that behavior in `api/auth/register.js`.

## Resend Notes

- Verify your sending domain before going live.
- `RESEND_FROM_EMAIL` should be something like `3AM Worldwide <hello@yourdomain.com>`.

## Deploy

1. Push this project to GitHub.
2. Import the repo in Vercel.
3. Add the environment variables above.
4. Deploy.

## Database Setup

Run the SQL in [db/schema.sql](/Users/3limuradi/Documents/New%20project/db/schema.sql) inside your Supabase SQL editor before testing live checkout.

That SQL now also:

- creates the `orders` table
- enables Row Level Security on `public.orders`
- allows authenticated users to read only their own orders

## Payment Provider Note

This project now uses Tap's hosted redirect flow for card and Benefit payments in Bahrain.

Tap's docs show:

- redirect flow with `transaction.url`
- `src_bh.benefit` for Benefit
- `src_all` to show supported payment methods on Tap's hosted payment page
- Benefit payments in `BHD`
- webhook validation using Tap's `hashstring` header and your secret key

## Admin Access

- Set `ADMIN_EMAILS` to a comma-separated list of admin account emails.
- Admin routes use the logged-in Supabase user and only allow those emails.
- Admin endpoints added:
  - `GET /api/admin/orders/list`
  - `POST /api/admin/orders/update-status`

## What Is Production-Ready Now

- Real signup via Supabase Auth
- Real login via Supabase Auth
- Authenticated current-user endpoint
- Persistent session restore through the backend
- Welcome email sending through Resend
- Hosted card and Benefit checkout with Tap
- Real order records stored in Supabase
- Authenticated order list and order detail endpoints
- Admin order list and order status update endpoints
- Tap webhook hash validation for payment confirmation
- RLS-enabled orders table for safe user order access

## Still Needed For Full Commerce Production

- Tap webhook hardening and settlement reconciliation
- Admin dashboard / fulfillment flow
- Frontend order-history page wired to the new order APIs
