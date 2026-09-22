import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeliveryOrderActions } from "./delivery-order-actions";

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

  type Row = (typeof rows)[number];
  const groups = new Map<string, { unitName: string; rows: Row[] }>();
  for (const r of rows) {
    const key = r.products?.business_unit_id ?? "lainnya";
    const unitName = r.products?.business_units?.name ?? "Lainnya";
    const group = groups.get(key) ?? { unitName, rows: [] };
    group.rows.push(r);
    groups.set(key, group);
  }
  const groupList = Array.from(groups.values());

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

      {groupList.map((group, i) => (
        <div
          key={group.unitName + i}
          className={`rounded-lg border border-neutral-200 bg-white p-6 print:rounded-none print:border-0 print:p-0 ${
            i < groupList.length - 1 ? "print:break-after-page" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">{group.unitName}</h2>
              <p className="mt-2 text-sm">Surat Jalan No: {order.code}</p>
            </div>
            <div className="text-right text-sm">
              <p>
                Tanggal <span className="ml-4">{tanggal}</span>
              </p>
              <p>
                Tuan <span className="ml-4">{order.companies?.name}</span>
              </p>
              <p>
                Toko{" "}
                <span className="ml-4">
                  {order.destination_address || order.companies?.address || "-"}
                </span>
              </p>
            </div>
          </div>

          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border border-neutral-900">
                <th className="border border-neutral-900 px-2 py-1 text-left">Nama Barang</th>
                <th className="border border-neutral-900 px-2 py-1 text-center">Satuan</th>
                <th className="border border-neutral-900 px-2 py-1 text-right">Quantity</th>
                <th className="border border-neutral-900 px-2 py-1 text-center">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((r) => (
                <tr key={r.id}>
                  <td className="border border-neutral-900 px-2 py-1">{r.products?.name}</td>
                  <td className="border border-neutral-900 px-2 py-1 text-center">
                    {r.products?.units?.name}
                  </td>
                  <td className="border border-neutral-900 px-2 py-1 text-right">
                    {r.quantity_sent}
                  </td>
                  <td className="border border-neutral-900 px-2 py-1 text-center">
                    {r.quantity_returned || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-10 flex justify-between text-sm">
            <p>Tanda Terima</p>
            <p>Hormat Kami,</p>
          </div>
          <div className="h-16" />
        </div>
      ))}

      {groupList.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          Belum ada barang di surat jalan ini.
        </div>
      ) : null}
    </div>
  );
}
