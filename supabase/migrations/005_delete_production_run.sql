-- Deletes a production run, reversing its stock effect first: the
-- finished-good yield is subtracted back out, and the raw materials it
-- consumed (per the recipe at hand) are returned. Both are logged as
-- 'adjustment' movements (a correction, not a real production/delivery
-- event) referencing the deleted run for traceability.
create or replace function delete_production_run(p_production_run_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_recipe_id uuid;
  v_finished_product_id uuid;
  v_quantity numeric;
  r record;
begin
  if get_my_role() not in ('owner','admin_gudang') then
    raise exception 'Tidak punya akses untuk menghapus riwayat produksi';
  end if;

  select recipe_id, finished_product_id, quantity_produced
    into v_recipe_id, v_finished_product_id, v_quantity
  from production_runs
  where id = p_production_run_id;

  if v_finished_product_id is null then
    raise exception 'Riwayat produksi tidak ditemukan';
  end if;

  insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
  values (v_finished_product_id, 'adjustment', -v_quantity, 'production_run_delete', p_production_run_id, auth.uid(), 'Riwayat produksi dihapus, hasil produksi dibatalkan');

  for r in
    select ri.raw_material_id, ri.quantity_per_unit * v_quantity as consumed
    from recipe_items ri
    where ri.recipe_id = v_recipe_id
  loop
    insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
    values (r.raw_material_id, 'adjustment', r.consumed, 'production_run_delete', p_production_run_id, auth.uid(), 'Riwayat produksi dihapus, bahan baku dikembalikan');
  end loop;

  delete from production_runs where id = p_production_run_id;
end;
$$;

revoke execute on function delete_production_run(uuid) from public, anon;
grant execute on function delete_production_run(uuid) to authenticated;
