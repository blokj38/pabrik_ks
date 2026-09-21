import { createClient } from "@/lib/supabase/server";
import { NewDeliveryForm } from "./new-delivery-form";

export default async function NewDeliveryOrderPage() {
  const supabase = await createClient();

  const [companiesRes, productsRes] = await Promise.all([
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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Buat Surat Jalan</h1>
        <p className="text-sm text-neutral-500">
          Surat jalan dibuat sebagai draft. Stok baru terpotong saat diterbitkan.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <NewDeliveryForm companies={companies} products={products} />
      </div>
    </div>
  );
}
