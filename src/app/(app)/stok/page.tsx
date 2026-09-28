import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StockMovementModal } from "./stock-movement-modal";

export default async function StokPage({
  searchParams,
}: {
  searchParams: Promise<{ unit_usaha?: string }>;
}) {
  const { unit_usaha: unitUsaha = "" } = await searchParams;
  const supabase = await createClient();

  const [productsRes, movementsRes, businessUnitsRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, category, business_model, current_stock, min_stock, business_unit_id, units(name), business_units(name)"
      )
      .order("name"),
    supabase
      .from("stock_movements")
      .select("id, movement_type, quantity, note, created_at, products(name, units(name))")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("business_units").select("id, name").order("name"),
  ]);

  const allProducts = productsRes.data ?? [];
  const movements = movementsRes.data ?? [];
  const businessUnits = businessUnitsRes.data ?? [];

  const products = unitUsaha
    ? allProducts.filter((p) => p.business_unit_id === unitUsaha)
    : allProducts;

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    unit_name: p.units?.name ?? null,
  }));

  const inTypes = new Set(["in", "production_yield", "delivery_return"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Stok</h1>
          <p className="text-sm text-neutral-500">
            Bahan baku dan barang jadi — {products.length} produk
            {unitUsaha ? " (difilter)" : " terdaftar"}.
          </p>
        </div>
        <StockMovementModal products={productOptions} />
      </div>

      <div className="flex flex-wrap gap-1 border-b border-neutral-200">
        <Link
          href="/stok"
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            !unitUsaha
              ? "border-neutral-900 text-neutral-900"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          Semua
        </Link>
        {businessUnits.map((bu) => (
          <Link
            key={bu.id}
            href={`/stok?unit_usaha=${bu.id}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              unitUsaha === bu.id
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {bu.name}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Unit Usaha</th>
              <th className="px-4 py-3 text-right">Stok</th>
              <th className="px-4 py-3 text-right">Min. Stok</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {products.map((p) => {
              const low = p.current_stock < p.min_stock;
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{p.name}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {p.category === "bahan_baku" ? "Bahan Baku" : "Barang Jadi"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{p.business_units?.name ?? "-"}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      low ? "text-red-600" : "text-neutral-900"
                    }`}
                  >
                    {p.current_stock} {p.units?.name}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500">
                    {p.min_stock} {p.units?.name}
                  </td>
                </tr>
              );
            })}
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Belum ada produk untuk filter ini.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Riwayat Mutasi Terbaru</h2>
        {movements.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Belum ada mutasi stok.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="text-neutral-800">{m.products?.name}</span>
                  {m.note ? <span className="ml-2 text-xs text-neutral-500">{m.note}</span> : null}
                </div>
                <div className="text-right">
                  <span
                    className={`font-medium ${
                      inTypes.has(m.movement_type) ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {inTypes.has(m.movement_type) ? "+" : "-"}
                    {m.quantity} {m.products?.units?.name}
                  </span>
                  <p className="text-xs text-neutral-400">
                    {new Date(m.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
