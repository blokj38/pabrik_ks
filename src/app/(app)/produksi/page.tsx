import { createClient } from "@/lib/supabase/server";
import { ProductionModal } from "./production-modal";
import { DeleteProductionRunButton } from "./delete-production-run-button";

export default async function ProduksiPage() {
  const supabase = await createClient();

  const [recipesRes, runsRes] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "id, name, recipe_outputs(quantity_per_batch, products(name, units(name))), recipe_items(quantity_per_unit, products!recipe_items_raw_material_id_fkey(name, units(name)))"
      )
      .order("name"),
    supabase
      .from("production_runs")
      .select(
        "id, batch_quantity, produced_at, note, recipes(name), production_run_outputs(quantity_produced, products(name, units(name)))"
      )
      .order("produced_at", { ascending: false })
      .limit(10),
  ]);

  const recipes = recipesRes.data ?? [];
  const runs = runsRes.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Produksi</h1>
        <p className="text-sm text-neutral-500">
          Resep (BOM) dan pencatatan hasil produksi. Stok bahan baku otomatis terpotong.
        </p>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          Belum ada resep. Tambahkan resep lewat Master Data terlebih dahulu.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => {
            const outputs = (r.recipe_outputs ?? []).map((ro) => ({
              name: ro.products?.name ?? "-",
              quantity_per_batch: ro.quantity_per_batch,
              unit_name: ro.products?.units?.name ?? null,
            }));
            const ingredients = (r.recipe_items ?? []).map((ri) => ({
              name: ri.products?.name ?? "-",
              quantity_per_unit: ri.quantity_per_unit,
              unit_name: ri.products?.units?.name ?? null,
            }));

            return (
              <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="font-semibold text-neutral-900">{r.name}</p>
                <p className="text-xs text-neutral-500">
                  Hasil: {outputs.map((o) => `${o.name} (${o.quantity_per_batch} ${o.unit_name ?? ""})`).join(", ")}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-neutral-600">
                  {ingredients.map((ing) => (
                    <li key={ing.name}>
                      {ing.name} — {ing.quantity_per_unit} {ing.unit_name} / batch
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <ProductionModal
                    recipeId={r.id}
                    recipeName={r.name}
                    outputs={outputs}
                    ingredients={ingredients}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Riwayat Produksi</h2>
        {runs.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Belum ada produksi tercatat.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100">
            {runs.map((run) => {
              const outputs = run.production_run_outputs ?? [];
              return (
                <li key={run.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-neutral-800">{run.recipes?.name}</span>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {outputs.map((o, idx) => (
                        <p key={idx} className="font-medium text-emerald-600">
                          +{o.quantity_produced} {o.products?.units?.name} {o.products?.name}
                        </p>
                      ))}
                      <p className="text-xs text-neutral-400">
                        {new Date(run.produced_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <DeleteProductionRunButton
                      productionRunId={run.id}
                      productName={run.recipes?.name ?? "-"}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
