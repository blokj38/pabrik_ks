import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/stat-card";

export default async function DashboardPage() {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [productsRes, activeDoRes, productionTodayRes] = await Promise.all([
    supabase.from("products").select("id, name, current_stock, min_stock, unit_id, units(name)"),
    supabase
      .from("delivery_orders")
      .select("id, code, status, customer_id, companies(name)")
      .neq("status", "selesai")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("production_runs")
      .select("id", { count: "exact", head: true })
      .gte("produced_at", todayStart.toISOString()),
  ]);

  const products = productsRes.data ?? [];
  const lowStock = products.filter((p) => p.current_stock < p.min_stock);
  const activeDeliveryOrders = activeDoRes.data ?? [];
  const productionToday = productionTodayRes.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Ringkasan operasional hari ini.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Produk" value={products.length} />
        <StatCard label="Stok Menipis" value={lowStock.length} warn={lowStock.length > 0} />
        <StatCard label="Surat Jalan Aktif" value={activeDeliveryOrders.length} />
        <StatCard label="Produksi Hari Ini" value={productionToday} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Stok Menipis</h2>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">Semua stok aman.</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-100">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-neutral-800">{p.name}</span>
                  <span className="font-medium text-red-600">
                    {p.current_stock} / min {p.min_stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Surat Jalan Aktif</h2>
          {activeDeliveryOrders.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">Tidak ada surat jalan aktif.</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-100">
              {activeDeliveryOrders.map((sj) => (
                <li key={sj.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-neutral-800">
                    {sj.code} — {sj.companies?.name}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                    {sj.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
