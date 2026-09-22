"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DeliveryOrderState = { error: string | null; success?: boolean };

type ItemInput = { product_id: string; quantity_sent: number; unit_price?: number };

export async function createDeliveryOrder(
  _prevState: DeliveryOrderState,
  formData: FormData
): Promise<DeliveryOrderState> {
  const supabase = await createClient();

  const customerId = String(formData.get("customer_id") ?? "");
  const driverName = String(formData.get("driver_name") ?? "") || null;
  const vehicle = String(formData.get("vehicle") ?? "") || null;
  const destinationAddress = String(formData.get("destination_address") ?? "") || null;
  const itemsRaw = String(formData.get("items") ?? "[]");

  let items: ItemInput[] = [];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "Data barang tidak valid." };
  }

  items = items.filter((it) => it.product_id && it.quantity_sent > 0);

  if (!customerId || items.length === 0) {
    return { error: "Pelanggan dan minimal satu barang wajib diisi." };
  }

  const { data: order, error: orderError } = await supabase
    .from("delivery_orders")
    .insert({
      customer_id: customerId,
      driver_name: driverName,
      vehicle,
      destination_address: destinationAddress,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "Gagal membuat surat jalan." };
  }

  const { error: itemsError } = await supabase.from("delivery_order_items").insert(
    items.map((it) => ({
      delivery_order_id: order.id,
      product_id: it.product_id,
      quantity_sent: it.quantity_sent,
      unit_price: it.unit_price ?? null,
    }))
  );

  if (itemsError) {
    return { error: itemsError.message };
  }

  revalidatePath("/surat-jalan");
  redirect(`/surat-jalan/${order.id}`);
}

export async function issueDeliveryOrder(deliveryOrderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("issue_delivery_order", {
    p_delivery_order_id: deliveryOrderId,
  });
  revalidatePath(`/surat-jalan/${deliveryOrderId}`);
  revalidatePath("/surat-jalan");
  revalidatePath("/stok");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function updateDeliveryOrderHeader(
  deliveryOrderId: string,
  _prevState: DeliveryOrderState,
  formData: FormData
): Promise<DeliveryOrderState> {
  const supabase = await createClient();

  const customerId = String(formData.get("customer_id") ?? "");
  const driverName = String(formData.get("driver_name") ?? "") || null;
  const vehicle = String(formData.get("vehicle") ?? "") || null;
  const destinationAddress = String(formData.get("destination_address") ?? "") || null;

  if (!customerId) {
    return { error: "Pelanggan wajib diisi." };
  }

  const { error } = await supabase
    .from("delivery_orders")
    .update({
      customer_id: customerId,
      driver_name: driverName,
      vehicle,
      destination_address: destinationAddress,
    })
    .eq("id", deliveryOrderId);

  if (error) return { error: error.message };

  revalidatePath(`/surat-jalan/${deliveryOrderId}`);
  revalidatePath("/surat-jalan");
  return { error: null, success: true };
}

export async function updateDraftDeliveryOrder(
  deliveryOrderId: string,
  _prevState: DeliveryOrderState,
  formData: FormData
): Promise<DeliveryOrderState> {
  const supabase = await createClient();

  const customerId = String(formData.get("customer_id") ?? "");
  const driverName = String(formData.get("driver_name") ?? "") || null;
  const vehicle = String(formData.get("vehicle") ?? "") || null;
  const destinationAddress = String(formData.get("destination_address") ?? "") || null;
  const itemsRaw = String(formData.get("items") ?? "[]");

  let items: ItemInput[] = [];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "Data barang tidak valid." };
  }
  items = items.filter((it) => it.product_id && it.quantity_sent > 0);

  if (!customerId || items.length === 0) {
    return { error: "Pelanggan dan minimal satu barang wajib diisi." };
  }

  const { data: order } = await supabase
    .from("delivery_orders")
    .select("status")
    .eq("id", deliveryOrderId)
    .single();

  if (order?.status !== "draft") {
    return { error: "Surat jalan ini sudah diterbitkan, tidak bisa diedit bebas lagi." };
  }

  const { error: orderError } = await supabase
    .from("delivery_orders")
    .update({
      customer_id: customerId,
      driver_name: driverName,
      vehicle,
      destination_address: destinationAddress,
    })
    .eq("id", deliveryOrderId);

  if (orderError) return { error: orderError.message };

  const { error: deleteError } = await supabase
    .from("delivery_order_items")
    .delete()
    .eq("delivery_order_id", deliveryOrderId);

  if (deleteError) return { error: deleteError.message };

  const { error: itemsError } = await supabase.from("delivery_order_items").insert(
    items.map((it) => ({
      delivery_order_id: deliveryOrderId,
      product_id: it.product_id,
      quantity_sent: it.quantity_sent,
      unit_price: it.unit_price ?? null,
    }))
  );

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/surat-jalan");
  redirect(`/surat-jalan/${deliveryOrderId}`);
}

export async function editDeliveryOrderItem(
  itemId: string,
  productId: string,
  quantitySent: number,
  unitPrice: number | null
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("edit_delivery_order_item", {
    p_item_id: itemId,
    p_product_id: productId,
    p_quantity_sent: quantitySent,
    p_unit_price: unitPrice ?? undefined,
  });
  revalidatePath("/stok");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function addDeliveryOrderItem(
  deliveryOrderId: string,
  productId: string,
  quantitySent: number,
  unitPrice: number | null
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_delivery_order_item", {
    p_delivery_order_id: deliveryOrderId,
    p_product_id: productId,
    p_quantity_sent: quantitySent,
    p_unit_price: unitPrice ?? undefined,
  });
  revalidatePath(`/surat-jalan/${deliveryOrderId}`);
  revalidatePath("/stok");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function removeDeliveryOrderItem(itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_delivery_order_item", {
    p_item_id: itemId,
  });
  revalidatePath("/stok");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function deleteDeliveryOrder(deliveryOrderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_delivery_order", {
    p_delivery_order_id: deliveryOrderId,
  });
  revalidatePath("/surat-jalan");
  revalidatePath("/stok");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function completeDeliveryOrder(
  deliveryOrderId: string,
  returns: { item_id: string; quantity_returned: number }[]
) {
  const supabase = await createClient();

  for (const r of returns) {
    if (r.quantity_returned > 0) {
      await supabase
        .from("delivery_order_items")
        .update({ quantity_returned: r.quantity_returned })
        .eq("id", r.item_id);
    }
  }

  const { error } = await supabase.rpc("complete_delivery_order", {
    p_delivery_order_id: deliveryOrderId,
  });

  revalidatePath(`/surat-jalan/${deliveryOrderId}`);
  revalidatePath("/surat-jalan");
  revalidatePath("/stok");
  revalidatePath("/");
  return { error: error?.message ?? null };
}
