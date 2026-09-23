import { createClient } from "@/lib/supabase/server";
import { deleteRecipe } from "./actions";
import { CreateRecipeForm } from "./create-recipe-form";
import { DeleteButton } from "./delete-button";

export async function ResepSection() {
  const supabase = await createClient();

  const [recipesRes, productsRes] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "id, name, products!recipes_finished_product_id_fkey(name), recipe_items(quantity_per_unit, products!recipe_items_raw_material_id_fkey(name, units(name)))"
      )
      .order("name"),
    supabase.from("products").select("id, name, category, units(name)").order("name"),
  ]);

  const recipes = recipesRes.data ?? [];
  const allProducts = productsRes.data ?? [];
  const finishedProducts = allProducts.filter((p) => p.category === "barang_jadi");
  const rawMaterials = allProducts
    .filter((p) => p.category === "bahan_baku")
    .map((p) => ({ id: p.id, name: p.name, unit_name: p.units?.name ?? null }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:col-span-1">
        <h2 className="text-sm font-semibold text-neutral-900">Tambah Resep (BOM)</h2>
        <div className="mt-3">
          <CreateRecipeForm finishedProducts={finishedProducts} rawMaterials={rawMaterials} />
        </div>
      </div>

      <div className="space-y-3 lg:col-span-2">
        {recipes.map((r) => (
          <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">{r.name}</p>
                <p className="text-xs text-neutral-500">Hasil: {r.products?.name}</p>
              </div>
              <DeleteButton
                action={deleteRecipe.bind(null, r.id)}
                confirmMessage={`Hapus resep "${r.name}"?`}
              />
            </div>
            <ul className="mt-2 space-y-1 text-sm text-neutral-600">
              {(r.recipe_items ?? []).map((ri, idx) => (
                <li key={idx}>
                  {ri.products?.name} — {ri.quantity_per_unit} {ri.products?.units?.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {recipes.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
            Belum ada resep.
          </div>
        ) : null}
      </div>
    </div>
  );
}
