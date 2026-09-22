-- Deletes a delivery order (any status). If it was already issued,
-- reverses the net stock effect of each item first (quantity_sent minus
-- quantity already returned) so current_stock stays accurate instead of
-- silently drifting low. delivery_order_items cascade-deletes via FK.
create or replace function delete_delivery_order(p_delivery_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_status delivery_status;
  r record;
  v_net numeric;
begin
  if get_my_role() not in ('owner','admin_gudang') then
    raise exception 'Tidak punya akses untuk menghapus surat jalan';
  end if;

  select status into v_status from delivery_orders where id = p_delivery_order_id;
  if v_status is null then
    raise exception 'Surat jalan tidak ditemukan';
  end if;

  if v_status <> 'draft' then
    for r in
      select product_id, quantity_sent, quantity_returned
      from delivery_order_items
      where delivery_order_id = p_delivery_order_id
    loop
      v_net := r.quantity_sent - r.quantity_returned;
      if v_net > 0 then
        insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
        values (r.product_id, 'delivery_return', v_net, 'delivery_order_delete', p_delivery_order_id, auth.uid(), 'Surat jalan dihapus, stok dikembalikan');
      end if;
    end loop;
  end if;

  delete from delivery_orders where id = p_delivery_order_id;
end;
$$;

revoke execute on function delete_delivery_order(uuid) from public, anon;
grant execute on function delete_delivery_order(uuid) to authenticated;
