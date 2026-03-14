do $$
declare
  admin_user_id uuid;
  house_uuid uuid;
  room_ashu uuid;
  room_jay uuid;
  room_bhaiya uuid;
  room_aunty uuid;
  month_0 text := to_char(date_trunc('month', current_date) - interval '2 month', 'YYYY-MM');
  month_1 text := to_char(date_trunc('month', current_date) - interval '1 month', 'YYYY-MM');
  month_2 text := to_char(date_trunc('month', current_date), 'YYYY-MM');
  bill_0 uuid;
  bill_1 uuid;
  bill_2 uuid;
begin
  select id into admin_user_id from auth.users order by created_at asc limit 1;

  if admin_user_id is null then
    raise exception 'Create at least one auth user before running supabase/seed.sql';
  end if;

  insert into public.houses (owner_user_id, name)
  values (admin_user_id, 'Pitru Chaya')
  on conflict do nothing
  returning id into house_uuid;

  if house_uuid is null then
    select id into house_uuid from public.houses where owner_user_id = admin_user_id and name = 'Pitru Chaya' limit 1;
  end if;

  insert into public.rooms (house_id, name) values (house_uuid, 'Ashu') on conflict (house_id, name) do nothing;
  insert into public.rooms (house_id, name) values (house_uuid, 'Jay') on conflict (house_id, name) do nothing;
  insert into public.rooms (house_id, name) values (house_uuid, 'Bhaiya') on conflict (house_id, name) do nothing;
  insert into public.rooms (house_id, name) values (house_uuid, 'Aunty') on conflict (house_id, name) do nothing;

  select id into room_ashu from public.rooms where house_id = house_uuid and name = 'Ashu';
  select id into room_jay from public.rooms where house_id = house_uuid and name = 'Jay';
  select id into room_bhaiya from public.rooms where house_id = house_uuid and name = 'Bhaiya';
  select id into room_aunty from public.rooms where house_id = house_uuid and name = 'Aunty';

  insert into public.bills (house_id, billing_month, status, main_bill_amount, total_units, price_per_unit, motor_previous_reading, motor_current_reading, motor_units, finalized_at)
  values (house_uuid, month_0, 'finalized', 7860, 1682, 4.6720, 144, 216, 72, now())
  on conflict (house_id, billing_month) do update set status = excluded.status
  returning id into bill_0;

  delete from public.motor_readings where bill_id = bill_0;
  insert into public.motor_readings (bill_id, house_id, billing_month, previous_reading, current_reading, units)
  values (bill_0, house_uuid, month_0, 144, 216, 72);

  delete from public.readings where bill_id = bill_0;
  insert into public.readings (bill_id, house_id, room_id, previous_reading, current_reading, units)
  values
    (bill_0, house_uuid, room_ashu, 812, 1110, 298),
    (bill_0, house_uuid, room_jay, 692, 938, 246),
    (bill_0, house_uuid, room_bhaiya, 544, 746, 202),
    (bill_0, house_uuid, room_aunty, 466, 634, 168);

  delete from public.bill_results where bill_id = bill_0;
  insert into public.bill_results (bill_id, room_id, room_name_snapshot, room_units, motor_share_units, final_units, bill_amount)
  values
    (bill_0, room_ashu, 'Ashu', 298, 18, 316, 1476.35),
    (bill_0, room_jay, 'Jay', 246, 18, 264, 1233.41),
    (bill_0, room_bhaiya, 'Bhaiya', 202, 18, 220, 1027.84),
    (bill_0, room_aunty, 'Aunty', 168, 18, 186, 869.00);

  insert into public.bills (house_id, billing_month, status, main_bill_amount, total_units, price_per_unit, motor_previous_reading, motor_current_reading, motor_units, finalized_at)
  values (house_uuid, month_1, 'finalized', 8645, 1824, 4.7396, 216, 301, 85, now())
  on conflict (house_id, billing_month) do update set status = excluded.status
  returning id into bill_1;

  delete from public.motor_readings where bill_id = bill_1;
  insert into public.motor_readings (bill_id, house_id, billing_month, previous_reading, current_reading, units)
  values (bill_1, house_uuid, month_1, 216, 301, 85);

  delete from public.readings where bill_id = bill_1;
  insert into public.readings (bill_id, house_id, room_id, previous_reading, current_reading, units)
  values
    (bill_1, house_uuid, room_ashu, 1110, 1468, 358),
    (bill_1, house_uuid, room_jay, 938, 1214, 276),
    (bill_1, house_uuid, room_bhaiya, 746, 971, 225),
    (bill_1, house_uuid, room_aunty, 634, 795, 161);

  delete from public.bill_results where bill_id = bill_1;
  insert into public.bill_results (bill_id, room_id, room_name_snapshot, room_units, motor_share_units, final_units, bill_amount)
  values
    (bill_1, room_ashu, 'Ashu', 358, 21.25, 379.25, 1797.45),
    (bill_1, room_jay, 'Jay', 276, 21.25, 297.25, 1408.90),
    (bill_1, room_bhaiya, 'Bhaiya', 225, 21.25, 246.25, 1167.12),
    (bill_1, room_aunty, 'Aunty', 161, 21.25, 182.25, 863.82);

  insert into public.bills (house_id, billing_month, status, main_bill_amount, total_units, price_per_unit, motor_previous_reading, motor_current_reading, motor_units, finalized_at)
  values (house_uuid, month_2, 'finalized', 8350, 1768, 4.7229, 301, 378, 77, now())
  on conflict (house_id, billing_month) do update set status = excluded.status
  returning id into bill_2;

  delete from public.motor_readings where bill_id = bill_2;
  insert into public.motor_readings (bill_id, house_id, billing_month, previous_reading, current_reading, units)
  values (bill_2, house_uuid, month_2, 301, 378, 77);

  delete from public.readings where bill_id = bill_2;
  insert into public.readings (bill_id, house_id, room_id, previous_reading, current_reading, units)
  values
    (bill_2, house_uuid, room_ashu, 1468, 1732, 264),
    (bill_2, house_uuid, room_jay, 1214, 1498, 284),
    (bill_2, house_uuid, room_bhaiya, 971, 1179, 208),
    (bill_2, house_uuid, room_aunty, 795, 980, 185);

  delete from public.bill_results where bill_id = bill_2;
  insert into public.bill_results (bill_id, room_id, room_name_snapshot, room_units, motor_share_units, final_units, bill_amount)
  values
    (bill_2, room_ashu, 'Ashu', 264, 19.25, 283.25, 1337.46),
    (bill_2, room_jay, 'Jay', 284, 19.25, 303.25, 1431.91),
    (bill_2, room_bhaiya, 'Bhaiya', 208, 19.25, 227.25, 1073.78),
    (bill_2, room_aunty, 'Aunty', 185, 19.25, 204.25, 964.26);
end $$;

