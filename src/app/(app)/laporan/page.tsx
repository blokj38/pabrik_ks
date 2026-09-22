import { createClient } from "@/lib/supabase/server";

function formatQty(value: number) {
  return value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{
    perusahaan?: string;
    unit_usaha?: string;
    dari?: string;
    sampai?: string;
  }>;
}) {
  const { perusahaan = "", unit_usaha = "", dari = "", sampai = "" } = await searchParams;

  const supabase = await createClient();

  const [rowsRes, companiesRes, businessUnitsRes] = await Promise.all([
    supabase
      .from("delivery_order_items")
      .select(
        "quantity_sent, quantity_returned, products(name, units(name), business_unit_id), delivery_orders(issued_at, status, customer_id, companies(name))"
      ),
    supabase.from("companies").select("id, name").order("name"),
    supabase.from("business_units").select("id, name").order("name"),
  ]);

  const companies = companiesRes.data ?? [];
  const businessUnits = businessUnitsRes.data ?? [];

  const dariDate = dari ? new Date(dari) : null;
  const sampaiDate = sampai ? new Date(`${sampai}T23:59:59`) : null;

  const validRows = (rowsRes.data ?? []).filter((r) => {
    const order = r.delivery_orders;
    if (!order || order.status === "draft" || !order.issued_at) return false;
    if (perusahaan && order.customer_id !== perusahaan) return false;
    if (unit_usaha && r.products?.business_unit_id !== unit_usaha) return false;
    const issuedAt = new Date(order.issued_at);
    if (dariDate && issuedAt < dariDate) return false;
    if (sampaiDate && issuedAt > sampaiDate) return false;
    return true;
  });

  type ProductKey = string;
  const productMeta = new Map<ProductKey, { name: string; unitName: string | null }>();
  const matrix = new Map<string, Map<ProductKey, number>>();
  const customersSet = new Set<string>();

  for (const r of validRows) {
    const customer = r.delivery_orders!.companies?.name ?? "Tanpa Pelanggan";
    const productName = r.products?.name ?? "-";
    const unitName = r.products?.units?.name ?? null;
    const key = `${productName}__${unitName ?? ""}`;
    const netQty = Math.max(0, r.quantity_sent - r.quantity_returned);

    customersSet.add(customer);
    if (!productMeta.has(key)) productMeta.set(key, { name: productName, unitName });

    if (!matrix.has(customer)) matrix.set(customer, new Map());
    const custMap = matrix.get(customer)!;
    custMap.set(key, (custMap.get(key) ?? 0) + netQty);
  }

  const productKeys = Array.from(productMeta.keys()).sort((a, b) =>
    productMeta.get(a)!.name.localeCompare(productMeta.get(b)!.name)
  );
  const customers = Array.from(customersSet).sort();

  const productTotals = new Map<ProductKey, number>();
  for (const key of productKeys) {
    let sum = 0;
    for (const customer of customers) {
      sum += matrix.get(customer)?.get(key) ?? 0;
    }
    productTotals.set(key, sum);
  }

  const hasFilter = perusahaan || unit_usaha || dari || sampai;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Laporan Penjualan</h1>
        <p className="text-sm text-neutral-500">
          Jumlah barang terjual (dikurangi retur) per pelanggan, berdasarkan Surat Jalan yang
          sudah diterbitkan (bukan draft).
        </p>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <div>
          <label className="block text-xs font-medium text-neutral-700">Perusahaan</label>
          <select
            name="perusahaan"
            defaultValue={perusahaan}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Semua</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700">Unit Usaha</label>
          <select
            name="unit_usaha"
            defaultValue={unit_usaha}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Semua</option>
            {businessUnits.map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700">Dari Tanggal</label>
          <input
            type="date"
            name="dari"
            defaultValue={dari}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700">Sampai Tanggal</label>
          <input
            type="date"
            name="sampai"
            defaultValue={sampai}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Terapkan
        </button>

        {hasFilter ? (
          <a
            href="/laporan"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Reset
          </a>
        ) : null}
      </form>

      {productKeys.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          Tidak ada data untuk filter yang dipilih.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="sticky left-0 bg-neutral-50 px-4 py-3">Pelanggan</th>
                {productKeys.map((key) => {
                  const meta = productMeta.get(key)!;
                  return (
                    <th key={key} className="whitespace-nowrap px-4 py-3 text-right">
                      {meta.name}
                      {meta.unitName ? ` (${meta.unitName})` : ""}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {customers.map((customer) => {
                const custMap = matrix.get(customer)!;
                return (
                  <tr key={customer}>
                    <td className="sticky left-0 bg-white px-4 py-3 font-medium text-neutral-900">
                      {customer}
                    </td>
                    {productKeys.map((key) => {
                      const value = custMap.get(key) ?? 0;
                      return (
                        <td key={key} className="whitespace-nowrap px-4 py-3 text-right text-neutral-600">
                          {value > 0 ? formatQty(value) : "-"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-300 bg-neutral-50 font-semibold text-neutral-900">
                <td className="sticky left-0 bg-neutral-50 px-4 py-3">Total</td>
                {productKeys.map((key) => (
                  <td key={key} className="whitespace-nowrap px-4 py-3 text-right">
                    {formatQty(productTotals.get(key) ?? 0)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
