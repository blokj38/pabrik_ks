-- Business units: the 3 separate letterhead identities under one factory
-- (e.g. Kecap, Garam, Kerupuk & Mie), used to split a single Surat Jalan
-- into one printed document per unit when a shipment carries goods from
-- more than one of them.
create table business_units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

alter table products add column business_unit_id uuid references business_units(id);

alter table business_units enable row level security;

create policy "business_units_select" on business_units for select
  using (auth.role() = 'authenticated');
create policy "business_units_write" on business_units for all
  using (get_my_role() in ('owner','admin_gudang'))
  with check (get_my_role() in ('owner','admin_gudang'));

insert into business_units (name) values
  ('Perusahaan Kecap KS'),
  ('CV. Obor Emas'),
  ('Kerupuk & Mie');
