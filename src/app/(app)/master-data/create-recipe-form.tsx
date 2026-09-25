"use client";

import { useActionState, useState } from "react";
import { createRecipe, type FormState } from "./actions";

type RawMaterial = { id: string; name: string; unit_name: string | null };
type IngredientRow = { raw_material_id: string; quantity_per_unit: string };

const initialState: FormState = { error: null };
const emptyIngredientRow: IngredientRow = { raw_material_id: "", quantity_per_unit: "" };

export function CreateRecipeForm({ rawMaterials }: { rawMaterials: RawMaterial[] }) {
  const [state, formAction, pending] = useActionState(createRecipe, initialState);
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([
    { ...emptyIngredientRow },
  ]);

  const updateIngredientRow = (index: number, patch: Partial<IngredientRow>) => {
    setIngredientRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const itemsJson = JSON.stringify(
    ingredientRows
      .filter((r) => r.raw_material_id && Number(r.quantity_per_unit) > 0)
      .map((r) => ({
        raw_material_id: r.raw_material_id,
        quantity_per_unit: Number(r.quantity_per_unit),
      }))
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="items" value={itemsJson} />

      <div>
        <label className="block text-sm font-medium text-neutral-700">Nama Resep</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Bahan baku (per 1 batch)</p>
        <p className="mb-2 text-xs text-neutral-500">
          Barang jadi yang dihasilkan diisi belakangan saat mencatat produksi, bukan di sini —
          karena hasilnya bisa beda-beda tiap produksi meski resepnya sama.
        </p>
        <div className="space-y-2">
          {ingredientRows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={row.raw_material_id}
                onChange={(e) => updateIngredientRow(i, { raw_material_id: e.target.value })}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Pilih bahan</option>
                {rawMaterials.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.unit_name ? `(${p.unit_name})` : ""}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Jumlah"
                value={row.quantity_per_unit}
                onChange={(e) => updateIngredientRow(i, { quantity_per_unit: e.target.value })}
                className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setIngredientRows((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={ingredientRows.length === 1}
                className="rounded-md border border-neutral-300 px-3 text-sm text-red-600 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIngredientRows((prev) => [...prev, { ...emptyIngredientRow }])}
          className="mt-2 w-full rounded-md border border-dashed border-neutral-300 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          + Tambah Bahan
        </button>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        Simpan Resep
      </button>
    </form>
  );
}
