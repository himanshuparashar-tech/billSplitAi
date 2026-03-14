create extension if not exists pgcrypto;

create table if not exists public.houses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (house_id, name)
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  billing_month text not null check (billing_month ~ '^\d{4}-\d{2}$'),
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  main_bill_amount numeric(12,2) not null,
  total_units numeric(12,2) not null,
  price_per_unit numeric(12,4) not null,
  motor_previous_reading numeric(12,2) not null default 0,
  motor_current_reading numeric(12,2) not null default 0,
  motor_units numeric(12,2) not null default 0,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (house_id, billing_month)
);

create table if not exists public.motor_readings (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null unique references public.bills(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  billing_month text not null check (billing_month ~ '^\d{4}-\d{2}$'),
  previous_reading numeric(12,2) not null,
  current_reading numeric(12,2) not null,
  units numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (house_id, billing_month)
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  previous_reading numeric(12,2) not null,
  current_reading numeric(12,2) not null,
  units numeric(12,2) not null,
  meter_photo_path text,
  meter_photo_url text,
  created_at timestamptz not null default now(),
  unique (bill_id, room_id)
);

create table if not exists public.bill_results (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  room_name_snapshot text not null,
  room_units numeric(12,2) not null,
  motor_share_units numeric(12,4) not null,
  final_units numeric(12,4) not null,
  bill_amount numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (bill_id, room_id)
);

create index if not exists idx_houses_owner on public.houses(owner_user_id);
create index if not exists idx_rooms_house on public.rooms(house_id);
create index if not exists idx_bills_house_month on public.bills(house_id, billing_month desc);
create index if not exists idx_motor_readings_bill on public.motor_readings(bill_id);
create index if not exists idx_readings_bill on public.readings(bill_id);
create index if not exists idx_results_bill on public.bill_results(bill_id);

alter table public.houses enable row level security;
alter table public.rooms enable row level security;
alter table public.bills enable row level security;
alter table public.motor_readings enable row level security;
alter table public.readings enable row level security;
alter table public.bill_results enable row level security;

drop policy if exists "houses_owner_all" on public.houses;
create policy "houses_owner_all" on public.houses
for all
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "rooms_owner_all" on public.rooms;
create policy "rooms_owner_all" on public.rooms
for all
using (
  exists (
    select 1 from public.houses h where h.id = rooms.house_id and h.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.houses h where h.id = rooms.house_id and h.owner_user_id = auth.uid()
  )
);

drop policy if exists "bills_owner_all" on public.bills;
create policy "bills_owner_all" on public.bills
for all
using (
  exists (
    select 1 from public.houses h where h.id = bills.house_id and h.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.houses h where h.id = bills.house_id and h.owner_user_id = auth.uid()
  )
);

drop policy if exists "motor_owner_all" on public.motor_readings;
create policy "motor_owner_all" on public.motor_readings
for all
using (
  exists (
    select 1 from public.houses h where h.id = motor_readings.house_id and h.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.houses h where h.id = motor_readings.house_id and h.owner_user_id = auth.uid()
  )
);

drop policy if exists "readings_owner_all" on public.readings;
create policy "readings_owner_all" on public.readings
for all
using (
  exists (
    select 1
    from public.houses h
    where h.id = readings.house_id and h.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.houses h
    where h.id = readings.house_id and h.owner_user_id = auth.uid()
  )
);

drop policy if exists "results_owner_all" on public.bill_results;
create policy "results_owner_all" on public.bill_results
for all
using (
  exists (
    select 1
    from public.bills b
    join public.houses h on h.id = b.house_id
    where b.id = bill_results.bill_id and h.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.bills b
    join public.houses h on h.id = b.house_id
    where b.id = bill_results.bill_id and h.owner_user_id = auth.uid()
  )
);

drop policy if exists "public_finalized_bills" on public.bills;
create policy "public_finalized_bills" on public.bills
for select
using (status = 'finalized');

drop policy if exists "public_finalized_houses" on public.houses;
create policy "public_finalized_houses" on public.houses
for select
using (
  exists (
    select 1 from public.bills b where b.house_id = houses.id and b.status = 'finalized'
  )
);

drop policy if exists "public_finalized_rooms" on public.rooms;
create policy "public_finalized_rooms" on public.rooms
for select
using (
  exists (
    select 1
    from public.readings r
    join public.bills b on b.id = r.bill_id
    where r.room_id = rooms.id and b.status = 'finalized'
  )
);

drop policy if exists "public_finalized_motor_readings" on public.motor_readings;
create policy "public_finalized_motor_readings" on public.motor_readings
for select
using (
  exists (
    select 1 from public.bills b where b.id = motor_readings.bill_id and b.status = 'finalized'
  )
);

drop policy if exists "public_finalized_readings" on public.readings;
create policy "public_finalized_readings" on public.readings
for select
using (
  exists (
    select 1 from public.bills b where b.id = readings.bill_id and b.status = 'finalized'
  )
);

drop policy if exists "public_finalized_results" on public.bill_results;
create policy "public_finalized_results" on public.bill_results
for select
using (
  exists (
    select 1 from public.bills b where b.id = bill_results.bill_id and b.status = 'finalized'
  )
);

insert into storage.buckets (id, name, public)
values ('meter-images', 'meter-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "meter_images_public_read" on storage.objects;
create policy "meter_images_public_read" on storage.objects
for select
using (bucket_id = 'meter-images');

drop policy if exists "meter_images_auth_upload" on storage.objects;
create policy "meter_images_auth_upload" on storage.objects
for insert
with check (bucket_id = 'meter-images' and auth.role() = 'authenticated');

drop policy if exists "meter_images_auth_update" on storage.objects;
create policy "meter_images_auth_update" on storage.objects
for update
using (bucket_id = 'meter-images' and auth.role() = 'authenticated')
with check (bucket_id = 'meter-images' and auth.role() = 'authenticated');

