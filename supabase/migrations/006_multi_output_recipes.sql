-- Lets one recipe yield several finished products per production batch,
-- instead of exactly one. recipe_outputs / production_run_outputs replace
-- the single finished_product_id + quantity_produced columns; those columns
-- are kept (now nullable) and backfilled for existing rows rather than
-- dropped, so nothing already recorded is lost.

create table recipe_outputs (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity_per_batch numeric not null
);

insert into recipe_outputs (recipe_id, product_id, quantity_per_batch)
select id, finished_product_id, 1 from recipes where finished_product_id is not null;

alter table recipes alter column finished_product_id drop not null;

create table production_run_outputs (
  id uuid primary key default gen_random_uuid(),
  production_run_id uuid not null references production_runs(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity_produced numeric not null
);

insert into production_run_outputs (production_run_id, product_id, quantity_produced)
select id, finished_product_id, quantity_produced from production_runs where finished_product_id is not null;

alter table production_runs add column batch_quantity numeric;
update production_runs set batch_quantity = quantity_produced where batch_quantity is null;
alter table production_runs alter column finished_product_id drop not null;
alter table production_runs alter column quantity_produced drop not null;

alter table recipe_outputs enable row level security;
create policy "recipe_outputs_select" on recipe_outputs for select
  using (auth.role() = 'authenticated');
create policy "recipe_outputs_write" on recipe_outputs for all
  using (get_my_role() in ('owner','admin_gudang','operator_produksi'))
  with check (get_my_role() in ('owner','admin_gudang','operator_produksi'));

alter table production_run_outputs enable row level security;
create policy "production_run_outputs_select" on production_run_outputs for select
  using (auth.role() = 'authenticated');

-- ============ UPDATED PRODUCTION RPC (multi-output) ============
create or replace function run_production(
  p_recipe_id uuid,
  p_batch_quantity numeric,
  p_note text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_run_id uuid;
  r record;
  v_needed numeric;
begin
  if not exists (select 1 from recipes where id = p_recipe_id) then
    raise exception 'Resep tidak ditemukan';
  end if;

  if not exists (select 1 from recipe_outputs where recipe_id = p_recipe_id) then
    raise exception 'Resep belum punya barang jadi hasil produksi';
  end if;

  for r in
    select ri.raw_material_id, ri.quantity_per_unit, p.current_stock, p.name
    from recipe_items ri join products p on p.id = ri.raw_material_id
    where ri.recipe_id = p_recipe_id
  loop
    v_needed := r.quantity_per_unit * p_batch_quantity;
    if r.current_stock < v_needed then
      raise exception 'Stok % tidak cukup: butuh %, tersedia %', r.name, v_needed, r.current_stock;
    end if;
  end loop;

  insert into production_runs (recipe_id, batch_quantity, note, produced_by)
  values (p_recipe_id, p_batch_quantity, p_note, auth.uid())
  returning id into v_run_id;

  for r in
    select ri.raw_material_id, ri.quantity_per_unit
    from recipe_items ri where ri.recipe_id = p_recipe_id
  loop
    insert into stock_movements (product_id, movement_type, quantity, note, reference_type, reference_id, created_by)
    values (r.raw_material_id, 'production_consume', r.quantity_per_unit * p_batch_quantity, p_note, 'production_run', v_run_id, auth.uid());
  end loop;

  for r in
    select ro.product_id, ro.quantity_per_batch
    from recipe_outputs ro where ro.recipe_id = p_recipe_id
  loop
    insert into production_run_outputs (production_run_id, product_id, quantity_produced)
    values (v_run_id, r.product_id, r.quantity_per_batch * p_batch_quantity);

    insert into stock_movements (product_id, movement_type, quantity, note, reference_type, reference_id, created_by)
    values (r.product_id, 'production_yield', r.quantity_per_batch * p_batch_quantity, p_note, 'production_run', v_run_id, auth.uid());
  end loop;

  return v_run_id;
end;
$$;

-- ============ UPDATED DELETE RPC (multi-output) ============
create or replace function delete_production_run(p_production_run_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_recipe_id uuid;
  v_batch_quantity numeric;
  r record;
begin
  if get_my_role() not in ('owner','admin_gudang') then
    raise exception 'Tidak punya akses untuk menghapus riwayat produksi';
  end if;

  select recipe_id, batch_quantity into v_recipe_id, v_batch_quantity
  from production_runs where id = p_production_run_id;

  if v_recipe_id is null then
    raise exception 'Riwayat produksi tidak ditemukan';
  end if;

  for r in
    select product_id, quantity_produced from production_run_outputs
    where production_run_id = p_production_run_id
  loop
    insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
    values (r.product_id, 'adjustment', -r.quantity_produced, 'production_run_delete', p_production_run_id, auth.uid(), 'Riwayat produksi dihapus, hasil produksi dibatalkan');
  end loop;

  for r in
    select ri.raw_material_id, ri.quantity_per_unit * v_batch_quantity as consumed
    from recipe_items ri
    where ri.recipe_id = v_recipe_id
  loop
    insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
    values (r.raw_material_id, 'adjustment', r.consumed, 'production_run_delete', p_production_run_id, auth.uid(), 'Riwayat produksi dihapus, bahan baku dikembalikan');
  end loop;

  delete from production_runs where id = p_production_run_id;
end;
$$;
