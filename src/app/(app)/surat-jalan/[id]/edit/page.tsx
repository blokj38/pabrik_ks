import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditDraftForm } from "./edit-draft-form";

export default async function EditDraftDeliveryOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("delivery_orders")
    .select("id, status, customer_id, driver_name, vehicle, destination_address")
    .eq("id", id)
    .single();

  if (!order) notFound();
  if (order.status !== "draft") redirect(`/surat-jalan/${id}`);

  const [itemsRes, companiesRes, productsRes] = await Promise.all([
    supabase
      .from("delivery_order_items")
      .select("id, product_id, quantity_sent, unit_price")
      .eq("delivery_order_id", id),
    supabase.from("companies").select("id, name").order("name"),
    supabase
      .from("products")
      .select("id, name, category, units(name)")
      .eq("category", "barang_jadi")
      .order("name"),
  ]);

  const companies = companiesRes.data ?? [];
  const products = (productsRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    unit_name: p.units?.name ?? null,
  }));
  const items = (itemsRes.data ?? []).map((it) => ({
    product_id: it.product_id,
    quantity_sent: String(it.quantity_sent),
    unit_price: it.unit_price != null ? String(it.unit_price) : "",
  }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Edit Surat Jalan (Draft)</h1>
        <p className="text-sm text-neutral-500">
          Belum diterbitkan, jadi bebas diubah tanpa memengaruhi stok.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <EditDraftForm
          deliveryOrderId={order.id}
          companies={companies}
          products={products}
          initialCustomerId={order.customer_id}
          initialDriverName={order.driver_name ?? ""}
          initialVehicle={order.vehicle ?? ""}
          initialDestinationAddress={order.destination_address ?? ""}
          initialItems={items}
        />
      </div>
    </div>
  );
}
