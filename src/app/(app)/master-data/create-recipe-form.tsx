"use client";

import { useActionState, useState } from "react";
import { createRecipe, type FormState } from "./actions";

type FinishedProduct = { id: string; name: string };
type RawMaterial = { id: string; name: string; unit_name: string | null };
type Row = { raw_material_id: string; quantity_per_unit: string };

const initialState: FormState = { error: null };
const emptyRow: Row = { raw_material_id: "", quantity_per_unit: "" };

export function CreateRecipeForm({
  finishedProducts,
  rawMaterials,
}: {
  finishedProducts: FinishedProduct[];
  rawMaterials: RawMaterial[];
}) {
  const [state, formAction, pending] = useActionState(createRecipe, initialState);
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const itemsJson = JSON.stringify(
    rows
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
        <label className="block text-sm font-medium text-neutral-700">Produk Hasil</label>
        <select
          name="finished_product_id"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Pilih produk jadi</option>
          {finishedProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">
          Bahan baku (per 1 unit hasil)
        </p>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={row.raw_material_id}
                onChange={(e) => updateRow(i, { raw_material_id: e.target.value })}
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
                onChange={(e) => updateRow(i, { quantity_per_unit: e.target.value })}
                className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={rows.length === 1}
                className="rounded-md border border-neutral-300 px-3 text-sm text-red-600 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { ...emptyRow }])}
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
