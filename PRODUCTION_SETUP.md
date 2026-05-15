# Production Setup

This project is wired for a production auth, email verification, welcome email, and receipt flow using Vercel, Supabase Auth, Brevo, and Stripe.

## What You Need

1. A Supabase project
2. A Brevo account
3. A verified sender email or domain in Brevo such as `hello@yourbrand.com` when you are ready for branded sending
4. A Vercel project for deployment
5. A Stripe account in a supported country such as the UAE

## Environment Variables

Add these in Vercel project settings:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BREVO_API_KEY=
BREVO_FROM_EMAIL=
PUBLIC_APP_NAME=3AM Worldwide
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
APP_URL=
ADMIN_EMAILS=
```

## Supabase Notes

- Enable Email/Password auth in Supabase.
- Enable email confirmation in Supabase Auth.
- The register endpoint now creates accounts in a verification-required state.
- The website expects a 6-digit email verification code as the main flow, and also supports the link fallback if Supabase still sends a `token_hash` link.

## Brevo Notes

- Verify your sender email or sending domain before going live.
- `BREVO_FROM_EMAIL` should be something like `3AM Worldwide <hello@yourdomain.com>`.
- If `BREVO_API_KEY` or `BREVO_FROM_EMAIL` is missing, the auth and order flows still work, but welcome/receipt/admin emails will be skipped gracefully.

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

This project now uses Stripe Checkout for hosted card payments.

Stripe's docs show:

- Checkout Sessions create a hosted payment page and return a session URL
- `success_url` and `cancel_url` control where customers come back after payment
- hosted Checkout works without collecting raw card details on your own site
- UAE Stripe accounts can present charges in `BHD`
- webhooks should verify the `Stripe-Signature` header with your webhook secret

## Admin Access

- Set `ADMIN_EMAILS` to a comma-separated list of admin account emails.
- Admin routes use the logged-in Supabase user and only allow those emails.
- Admin endpoints added:
  - `GET /api/admin/orders/list`
  - `POST /api/admin/orders/update-status`

## What Is Production-Ready Now

- Real signup via Supabase Auth
- Email verification step before login
- Real login via Supabase Auth
- Persistent session restore through the backend
- Welcome email sending through Brevo after verification
- Hosted card checkout with Stripe
- Real order records stored in Supabase
- Authenticated order list and order detail endpoints
- Admin order list and order status update endpoints
- Stripe session verification on checkout return
- Stripe webhook signature verification for checkout completion events
- Customer receipt emails after paid/confirmed orders
- Admin order notification emails after paid/confirmed orders
- RLS-enabled orders table for safe user order access

## Still Needed For Full Commerce Production

- Connect Stripe webhook endpoint to `/api/checkout/verify-session`
- Frontend order-history page wired to the new order APIs
