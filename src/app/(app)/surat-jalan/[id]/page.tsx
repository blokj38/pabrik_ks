import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeliveryOrderActions } from "./delivery-order-actions";
import { PrintDocuments } from "./print-documents";

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
      "id, code, status, driver_name, vehicle, destination_address, created_at, issued_at, completed_at, companies(name, address, phone)"
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("delivery_order_items")
    .select(
      "id, quantity_sent, quantity_returned, unit_price, products(name, units(name), business_unit_id, business_units(name))"
    )
    .eq("delivery_order_id", id);

  const rows = items ?? [];

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
      </div>

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
