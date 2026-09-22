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
    .select("id, quantity_sent, quantity_returned, unit_price, products(name, units(name))")
    .eq("delivery_order_id", id);

  const rows = items ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="no-print flex items-center justify-between">
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

      <div className="print-area rounded-lg border border-neutral-200 bg-white p-6">
        <div className="border-b border-neutral-900 pb-2 text-center">
          <h2 className="text-lg font-bold">SURAT JALAN</h2>
          <p className="text-sm">{order.code}</p>
        </div>

        <div className="mt-3 flex justify-between text-sm">
          <div>
            <p className="font-medium">Kepada:</p>
            <p>{order.companies?.name}</p>
            <p className="text-neutral-600">
              {order.destination_address || order.companies?.address}
            </p>
          </div>
          <div className="text-right">
            <p>Tanggal: {new Date(order.created_at).toLocaleDateString("id-ID")}</p>
            <p>Supir: {order.driver_name ?? "-"}</p>
            <p>Armada: {order.vehicle ?? "-"}</p>
          </div>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-y border-neutral-900">
              <th className="py-1 text-left font-medium">Barang</th>
              <th className="py-1 text-right font-medium">Jumlah Kirim</th>
              <th className="py-1 text-right font-medium">Jumlah Retur</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-1">{r.products?.name}</td>
                <td className="py-1 text-right">
                  {r.quantity_sent} {r.products?.units?.name}
                </td>
                <td className="py-1 text-right">{r.quantity_returned || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-neutral-900" />

        <div className="mt-10 flex justify-between text-center text-sm">
          <div className="w-1/3">
            <p>Pengirim</p>
            <div className="h-10" />
            <p className="border-t border-neutral-900 pt-1">( {order.driver_name ?? "........."} )</p>
          </div>
          <div className="w-1/3">
            <p>Penerima</p>
            <div className="h-10" />
            <p className="border-t border-neutral-900 pt-1">( ......................... )</p>
          </div>
        </div>
      </div>
    </div>
  );
}
