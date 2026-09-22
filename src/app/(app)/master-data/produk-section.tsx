import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "./actions";
import { CreateProductForm } from "./create-product-form";
import { EditProductModal } from "./edit-product-modal";

export async function ProdukSection() {
  const supabase = await createClient();
  const [productsRes, unitsRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, category, business_model, current_stock, min_stock, unit_id, price_retail, price_wholesale, units(name)"
      )
      .order("name"),
    supabase.from("units").select("id, name").order("name"),
  ]);

  const products = productsRes.data ?? [];
  const units = unitsRes.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:col-span-1">
        <h2 className="text-sm font-semibold text-neutral-900">Tambah Produk</h2>
        <div className="mt-3">
          <CreateProductForm units={units} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white lg:col-span-2">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3 text-right">Stok</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{p.name}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {p.category === "bahan_baku" ? "Bahan Baku" : "Barang Jadi"}
                </td>
                <td className="px-4 py-3 text-right text-neutral-600">
                  {p.current_stock} {p.units?.name}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <EditProductModal
                      product={{
                        id: p.id,
                        name: p.name,
                        category: p.category,
                        business_model: p.business_model,
                        unit_id: p.unit_id,
                        min_stock: p.min_stock,
                        price_retail: p.price_retail,
                        price_wholesale: p.price_wholesale,
                      }}
                      units={units}
                    />
                    <form action={deleteProduct.bind(null, p.id)}>
                      <button className="text-xs text-red-600 hover:underline">Hapus</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  Belum ada produk.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
