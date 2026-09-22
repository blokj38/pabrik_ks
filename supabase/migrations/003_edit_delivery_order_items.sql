-- Lets a draft-or-issued delivery order's items be corrected after the
-- fact, reconciling the stock ledger by delta instead of touching
-- delivery_order_items directly (which would silently desync stock).

create or replace function edit_delivery_order_item(
  p_item_id uuid,
  p_product_id uuid,
  p_quantity_sent numeric,
  p_unit_price numeric default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_status delivery_status;
  v_old_product_id uuid;
  v_old_qty numeric;
  v_available numeric;
  v_delta numeric;
begin
  if get_my_role() not in ('owner','admin_gudang','kasir_sales') then
    raise exception 'Tidak punya akses untuk mengubah surat jalan';
  end if;

  select doi.delivery_order_id, doi.product_id, doi.quantity_sent, do_.status
    into v_order_id, v_old_product_id, v_old_qty, v_status
  from delivery_order_items doi
  join delivery_orders do_ on do_.id = doi.delivery_order_id
  where doi.id = p_item_id;

  if v_order_id is null then
    raise exception 'Item surat jalan tidak ditemukan';
  end if;
  if v_status not in ('diterbitkan','dalam_pengiriman') then
    raise exception 'Surat jalan berstatus % tidak bisa diedit itemnya', v_status;
  end if;
  if p_quantity_sent <= 0 then
    raise exception 'Jumlah harus lebih dari 0';
  end if;

  if p_product_id <> v_old_product_id then
    insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
    values (v_old_product_id, 'delivery_return', v_old_qty, 'delivery_order_edit', v_order_id, auth.uid(), 'Koreksi surat jalan: produk diganti');

    select current_stock into v_available from products where id = p_product_id;
    if v_available < p_quantity_sent then
      raise exception 'Stok tidak cukup untuk produk baru: butuh %, tersedia %', p_quantity_sent, v_available;
    end if;
    insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
    values (p_product_id, 'delivery_out', p_quantity_sent, 'delivery_order_edit', v_order_id, auth.uid(), 'Koreksi surat jalan: produk diganti');
  elsif p_quantity_sent <> v_old_qty then
    v_delta := p_quantity_sent - v_old_qty;
    if v_delta > 0 then
      select current_stock into v_available from products where id = p_product_id;
      if v_available < v_delta then
        raise exception 'Stok tidak cukup: butuh tambahan %, tersedia %', v_delta, v_available;
      end if;
      insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
      values (p_product_id, 'delivery_out', v_delta, 'delivery_order_edit', v_order_id, auth.uid(), 'Koreksi surat jalan: jumlah bertambah');
    else
      insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
      values (p_product_id, 'delivery_return', -v_delta, 'delivery_order_edit', v_order_id, auth.uid(), 'Koreksi surat jalan: jumlah berkurang');
    end if;
  end if;

  update delivery_order_items
  set product_id = p_product_id, quantity_sent = p_quantity_sent, unit_price = p_unit_price
  where id = p_item_id;
end;
$$;

create or replace function add_delivery_order_item(
  p_delivery_order_id uuid,
  p_product_id uuid,
  p_quantity_sent numeric,
  p_unit_price numeric default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_status delivery_status;
  v_available numeric;
  v_item_id uuid;
begin
  if get_my_role() not in ('owner','admin_gudang','kasir_sales') then
    raise exception 'Tidak punya akses untuk mengubah surat jalan';
  end if;

  select status into v_status from delivery_orders where id = p_delivery_order_id;
  if v_status is null then
    raise exception 'Surat jalan tidak ditemukan';
  end if;
  if v_status not in ('diterbitkan','dalam_pengiriman') then
    raise exception 'Surat jalan berstatus % tidak bisa ditambah barang', v_status;
  end if;
  if p_quantity_sent <= 0 then
    raise exception 'Jumlah harus lebih dari 0';
  end if;

  select current_stock into v_available from products where id = p_product_id;
  if v_available < p_quantity_sent then
    raise exception 'Stok tidak cukup: butuh %, tersedia %', p_quantity_sent, v_available;
  end if;

  insert into delivery_order_items (delivery_order_id, product_id, quantity_sent, unit_price)
  values (p_delivery_order_id, p_product_id, p_quantity_sent, p_unit_price)
  returning id into v_item_id;

  insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
  values (p_product_id, 'delivery_out', p_quantity_sent, 'delivery_order_edit', p_delivery_order_id, auth.uid(), 'Tambahan barang setelah surat jalan diterbitkan');

  return v_item_id;
end;
$$;

create or replace function remove_delivery_order_item(p_item_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_status delivery_status;
  v_product_id uuid;
  v_qty numeric;
begin
  if get_my_role() not in ('owner','admin_gudang','kasir_sales') then
    raise exception 'Tidak punya akses untuk mengubah surat jalan';
  end if;

  select doi.delivery_order_id, doi.product_id, doi.quantity_sent, do_.status
    into v_order_id, v_product_id, v_qty, v_status
  from delivery_order_items doi
  join delivery_orders do_ on do_.id = doi.delivery_order_id
  where doi.id = p_item_id;

  if v_order_id is null then
    raise exception 'Item surat jalan tidak ditemukan';
  end if;
  if v_status not in ('diterbitkan','dalam_pengiriman') then
    raise exception 'Surat jalan berstatus % tidak bisa dihapus itemnya', v_status;
  end if;

  insert into stock_movements (product_id, movement_type, quantity, reference_type, reference_id, created_by, note)
  values (v_product_id, 'delivery_return', v_qty, 'delivery_order_edit', v_order_id, auth.uid(), 'Koreksi surat jalan: barang dihapus');

  delete from delivery_order_items where id = p_item_id;
end;
$$;

revoke execute on function edit_delivery_order_item(uuid, uuid, numeric, numeric) from public, anon;
revoke execute on function add_delivery_order_item(uuid, uuid, numeric, numeric) from public, anon;
revoke execute on function remove_delivery_order_item(uuid) from public, anon;
grant execute on function edit_delivery_order_item(uuid, uuid, numeric, numeric) to authenticated;
grant execute on function add_delivery_order_item(uuid, uuid, numeric, numeric) to authenticated;
grant execute on function remove_delivery_order_item(uuid) to authenticated;
