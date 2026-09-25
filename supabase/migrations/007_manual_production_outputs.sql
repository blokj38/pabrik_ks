-- Moves "which finished goods came out of this batch" from being fixed on
-- the recipe (recipe_outputs) to being entered manually each time
-- production is recorded, since the same recipe can yield a different
-- product mix from one run to the next. recipe_outputs is dropped;
-- production_run_outputs stays (still populated, just from direct user
-- input via p_outputs instead of recipe_outputs * batch_quantity).

drop table if exists recipe_outputs;

drop function if exists run_production(uuid, numeric, text);

create or replace function run_production(
  p_recipe_id uuid,
  p_batch_quantity numeric,
  p_outputs jsonb,
  p_note text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_run_id uuid;
  r record;
  v_needed numeric;
  v_out record;
begin
  if not exists (select 1 from recipes where id = p_recipe_id) then
    raise exception 'Resep tidak ditemukan';
  end if;

  if p_outputs is null or jsonb_array_length(p_outputs) = 0 then
    raise exception 'Barang jadi hasil produksi wajib diisi';
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

  for v_out in
    select * from jsonb_to_recordset(p_outputs) as x(product_id uuid, quantity numeric)
  loop
    if v_out.quantity is null or v_out.quantity <= 0 then
      continue;
    end if;

    insert into production_run_outputs (production_run_id, product_id, quantity_produced)
    values (v_run_id, v_out.product_id, v_out.quantity);

    insert into stock_movements (product_id, movement_type, quantity, note, reference_type, reference_id, created_by)
    values (v_out.product_id, 'production_yield', v_out.quantity, p_note, 'production_run', v_run_id, auth.uid());
  end loop;

  return v_run_id;
end;
$$;

revoke execute on function run_production(uuid, numeric, jsonb, text) from public, anon;
grant execute on function run_production(uuid, numeric, jsonb, text) to authenticated;
