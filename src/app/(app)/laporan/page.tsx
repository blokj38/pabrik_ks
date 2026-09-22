import { createClient } from "@/lib/supabase/server";

function formatRupiah(value: number) {
  return value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
}

function formatMonthLabel(yyyyMm: string) {
  const [year, month] = yyyyMm.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
}

export default async function LaporanPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("delivery_order_items")
    .select(
      "quantity_sent, quantity_returned, unit_price, delivery_orders(issued_at, status, companies(name))"
    );

  const validRows = (rows ?? []).filter(
    (r) => r.delivery_orders && r.delivery_orders.status !== "draft" && r.delivery_orders.issued_at
  );

  const missingPriceCount = validRows.filter((r) => r.unit_price == null).length;

  const matrix = new Map<string, Map<string, number>>();
  const monthsSet = new Set<string>();
  const customersSet = new Set<string>();

  for (const r of validRows) {
    if (r.unit_price == null) continue;
    const month = r.delivery_orders!.issued_at!.slice(0, 7);
    const customer = r.delivery_orders!.companies?.name ?? "Tanpa Pelanggan";
    const netQty = Math.max(0, r.quantity_sent - r.quantity_returned);
    const amount = netQty * r.unit_price;

    monthsSet.add(month);
    customersSet.add(customer);

    if (!matrix.has(customer)) matrix.set(customer, new Map());
    const custMap = matrix.get(customer)!;
    custMap.set(month, (custMap.get(month) ?? 0) + amount);
  }

  const months = Array.from(monthsSet).sort();
  const customers = Array.from(customersSet).sort();

  const monthlyTotals = new Map<string, number>();
  for (const month of months) {
    let sum = 0;
    for (const customer of customers) {
      sum += matrix.get(customer)?.get(month) ?? 0;
    }
    monthlyTotals.set(month, sum);
  }

  const grandTotal = Array.from(monthlyTotals.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Laporan Penjualan</h1>
        <p className="text-sm text-neutral-500">
          Berdasarkan Surat Jalan yang sudah diterbitkan (bukan draft), dihitung dari harga per
          unit yang diisi saat pembuatan Surat Jalan, dikurangi barang retur.
        </p>
        {missingPriceCount > 0 ? (
          <p className="mt-1 text-xs text-amber-600">
            {missingPriceCount} baris barang tidak dihitung karena harga/unit belum diisi saat
            surat jalan dibuat.
          </p>
        ) : null}
      </div>

      {months.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          Belum ada data penjualan (surat jalan yang diterbitkan dengan harga terisi).
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="sticky left-0 bg-neutral-50 px-4 py-3">Pelanggan</th>
                {months.map((m) => (
                  <th key={m} className="whitespace-nowrap px-4 py-3 text-right">
                    {formatMonthLabel(m)}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {customers.map((customer) => {
                const custMap = matrix.get(customer)!;
                const rowTotal = months.reduce((sum, m) => sum + (custMap.get(m) ?? 0), 0);
                return (
                  <tr key={customer}>
                    <td className="sticky left-0 bg-white px-4 py-3 font-medium text-neutral-900">
                      {customer}
                    </td>
                    {months.map((m) => {
                      const value = custMap.get(m) ?? 0;
                      return (
                        <td key={m} className="whitespace-nowrap px-4 py-3 text-right text-neutral-600">
                          {value > 0 ? formatRupiah(value) : "-"}
                        </td>
                      );
                    })}
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-neutral-900">
                      {formatRupiah(rowTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-300 bg-neutral-50 font-semibold text-neutral-900">
                <td className="sticky left-0 bg-neutral-50 px-4 py-3">Total</td>
                {months.map((m) => (
                  <td key={m} className="whitespace-nowrap px-4 py-3 text-right">
                    {formatRupiah(monthlyTotals.get(m) ?? 0)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {formatRupiah(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
