create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  customer_phone text not null,
  shipping_location text not null,
  shipping_address text not null,
  payment_method text not null check (payment_method in ('cod', 'card')),
  payment_status text not null,
  order_status text not null default 'pending',
  internal_note text,
  provider text,
  provider_reference text,
  subtotal_bhd numeric(10, 3) not null,
  shipping_bhd numeric(10, 3) not null,
  total_bhd numeric(10, 3) not null,
  currency text not null default 'BHD',
  cart_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_email_idx on public.orders (customer_email);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.orders to authenticated;

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
on public.orders
for select
to authenticated
using (auth.uid() = user_id);
