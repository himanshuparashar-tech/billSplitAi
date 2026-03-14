# SplitBill AI

Next.js 14 App Router application for splitting house electricity bills using sub-meter readings, equal motor sharing, finalized monthly snapshots, and Supabase-backed storage.

## Stack

- Next.js 14 App Router
- TypeScript
- TailwindCSS
- Supabase Auth + Database + Storage
- Recharts
- Vercel-ready deployment

## Features

- Admin signup, login, logout with Supabase auth
- Multi-house management from one user account
- Non-authenticated member billing entries per house
- Draft and finalized monthly billing workflow
- Immutable `bill_results` snapshots until reopened
- Meter photo upload to Supabase Storage
- Dashboard analytics with bar, line, and pie charts
- Monthly history table with public share links
- Export selected bills as PDF, Excel, or JPG
- Public finalized bill page at `/bill/[billId]`
- Built-in seeded demo mode when Supabase env vars are missing

## Local development

1. Install dependencies:
   - `npm install`
2. Configure environment variables from `.env.example`.
3. Start the app:
   - `npm run dev`

If Supabase is not configured, the app still runs in demo mode with seeded sample data for `Pitru Chaya` and the last 3 months of bills.

## Supabase setup

1. Create a Supabase project.
2. Run [supabase/schema.sql](/C:/D-Drive/hackathon/SplitBill_AI/supabase/schema.sql) in the SQL editor.
3. Create one admin auth user through the app or dashboard auth UI.
4. Run [supabase/seed.sql](/C:/D-Drive/hackathon/SplitBill_AI/supabase/seed.sql) to populate demo house data for the first auth user.
5. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` or `.env`.

## Billing formula

- `member_units = current_reading - previous_reading`
- `motor_units = motor_current - motor_previous`
- `price_per_unit = main_bill_amount / total_units`
- `motor_share_per_member = motor_units / member_count`
- `member_final_units = member_units + motor_share_per_member`
- `final_bill_amount = member_final_units * price_per_unit`

## Deployment

Deploy to Vercel with these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` optional for future admin/server jobs

Build command: `npm run build`
Output: Next.js default

## Notes

- Finalized bills are publicly readable by ID so `/bill/[billId]` works without auth.
- Meter photos use a public Supabase storage bucket named `meter-photos`.
- The previous Vite application was removed and replaced with the Next.js codebase.
