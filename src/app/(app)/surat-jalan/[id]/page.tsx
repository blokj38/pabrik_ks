import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeliveryOrderActions } from "./delivery-order-actions";
import { PrintDocuments } from "./print-documents";
import { EditHeaderModal } from "./edit-header-modal";
import { IssuedItemsEditor } from "./issued-items-editor";
import { DeleteDeliveryOrderButton } from "../delete-button";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  diterbitkan: "Diterbitkan",
  dalam_pengiriman: "Dalam Pengiriman",
  selesai: "Selesai",
};

export default async function DeliveryOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("delivery_orders")
    .select(
      "id, code, status, customer_id, driver_name, vehicle, destination_address, created_at, issued_at, completed_at, companies(name, address, phone)"
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  const [itemsRes, companiesRes, productsRes] = await Promise.all([
    supabase
      .from("delivery_order_items")
      .select(
        "id, product_id, quantity_sent, quantity_returned, unit_price, products(name, units(name), business_unit_id, business_units(name))"
      )
      .eq("delivery_order_id", id),
    supabase.from("companies").select("id, name").order("name"),
    supabase
      .from("products")
      .select("id, name, category, units(name)")
      .eq("category", "barang_jadi")
      .order("name"),
  ]);

  const rows = itemsRes.data ?? [];
  const companies = companiesRes.data ?? [];
  const productOptions = (productsRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    unit_name: p.units?.name ?? null,
  }));

  const canEditItems = order.status === "diterbitkan" || order.status === "dalam_pengiriman";

  type PrintRow = {
    id: string;
    product_name: string;
    unit_name: string | null;
    quantity_sent: number;
    quantity_returned: number;
  };
  const groups = new Map<string, { unitName: string; rows: PrintRow[] }>();
  for (const r of rows) {
    const key = r.products?.business_unit_id ?? "lainnya";
    const unitName = r.products?.business_units?.name ?? "Lainnya";
    const group = groups.get(key) ?? { unitName, rows: [] };
    group.rows.push({
      id: r.id,
      product_name: r.products?.name ?? "-",
      unit_name: r.products?.units?.name ?? null,
      quantity_sent: r.quantity_sent,
      quantity_returned: r.quantity_returned,
    });
    groups.set(key, group);
  }
  const groupList = Array.from(groups.entries()).map(([key, g]) => ({ key, ...g }));

  const tanggal = new Date(order.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });

  return (
    <div className="max-w-3xl space-y-6 print:max-w-none print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">{order.code}</h1>
          <p className="text-sm text-neutral-500">{STATUS_LABEL[order.status]}</p>
        </div>
        <div className="flex gap-2">
          {order.status === "draft" ? (
            <Link
              href={`/surat-jalan/${order.id}/edit`}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Edit
            </Link>
          ) : null}
          {canEditItems ? (
            <EditHeaderModal
              deliveryOrderId={order.id}
              companies={companies}
              initialCustomerId={order.customer_id}
              initialDriverName={order.driver_name ?? ""}
              initialVehicle={order.vehicle ?? ""}
              initialDestinationAddress={order.destination_address ?? ""}
            />
          ) : null}
          <DeliveryOrderActions
            deliveryOrderId={order.id}
            status={order.status}
            items={rows.map((r) => ({
              id: r.id,
              product_name: r.products?.name ?? "-",
              quantity_sent: r.quantity_sent,
              unit_name: r.products?.units?.name ?? null,
            }))}
          />
          <DeleteDeliveryOrderButton
            deliveryOrderId={order.id}
            code={order.code ?? ""}
            redirectTo="/surat-jalan"
          />
        </div>
      </div>

      {canEditItems ? (
        <IssuedItemsEditor
          deliveryOrderId={order.id}
          items={rows.map((r) => ({
            id: r.id,
            product_id: r.product_id,
            product_name: r.products?.name ?? "-",
            unit_name: r.products?.units?.name ?? null,
            quantity_sent: r.quantity_sent,
            unit_price: r.unit_price,
          }))}
          products={productOptions}
        />
      ) : null}

      <PrintDocuments
        groups={groupList}
        code={order.code ?? ""}
        tanggal={tanggal}
        customerName={order.companies?.name}
        destination={order.destination_address || order.companies?.address || ""}
      />
    </div>
  );
}
