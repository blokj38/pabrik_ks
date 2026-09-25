"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { runProductionAction, type ProductionState } from "./actions";

type Ingredient = { name: string; quantity_per_unit: number; unit_name: string | null };
type FinishedProduct = { id: string; name: string; unit_name: string | null };
type OutputRow = { product_id: string; quantity: string };

const initialState: ProductionState = { error: null };
const emptyOutputRow: OutputRow = { product_id: "", quantity: "" };

export function ProductionModal({
  recipeId,
  recipeName,
  ingredients,
  finishedProducts,
}: {
  recipeId: string;
  recipeName: string;
  ingredients: Ingredient[];
  finishedProducts: FinishedProduct[];
}) {
  const [open, setOpen] = useState(false);
  const [batchQuantity, setBatchQuantity] = useState(1);
  const [outputRows, setOutputRows] = useState<OutputRow[]>([{ ...emptyOutputRow }]);
  const [state, formAction, pending] = useActionState(runProductionAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the modal in response to the server action's result, not a derived render value
      setOpen(false);
    }
  }, [state.success]);

  const updateOutputRow = (index: number, patch: Partial<OutputRow>) => {
    setOutputRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const outputsJson = JSON.stringify(
    outputRows
      .filter((r) => r.product_id && Number(r.quantity) > 0)
      .map((r) => ({ product_id: r.product_id, quantity: Number(r.quantity) }))
  );

  return (
    <>
      <button
        onClick={() => {
          setOutputRows([{ ...emptyOutputRow }]);
          setBatchQuantity(1);
          setOpen(true);
        }}
        className="w-full rounded-md border border-amber-300 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
      >
        Produksi
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-neutral-900">Produksi — {recipeName}</h3>

            <form ref={formRef} action={formAction} className="mt-4 space-y-3">
              <input type="hidden" name="recipe_id" value={recipeId} />
              <input type="hidden" name="outputs" value={outputsJson} />

              <div>
                <label className="block text-sm font-medium text-neutral-700">Jumlah Batch</label>
                <input
                  name="batch_quantity"
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={batchQuantity}
                  onChange={(e) => setBatchQuantity(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="rounded-md bg-neutral-50 p-3 text-sm">
                <p className="mb-1 font-medium text-neutral-700">Kebutuhan bahan:</p>
                <ul className="space-y-1">
                  {ingredients.map((ing) => (
                    <li key={ing.name} className="flex justify-between text-neutral-600">
                      <span>{ing.name}</span>
                      <span>
                        {(ing.quantity_per_unit * batchQuantity).toLocaleString("id-ID")}{" "}
                        {ing.unit_name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-neutral-700">
                  Barang jadi dihasilkan
                </p>
                <div className="space-y-2">
                  {outputRows.map((row, i) => (
                    <div key={i} className="flex gap-2">
                      <select
                        value={row.product_id}
                        onChange={(e) => updateOutputRow(i, { product_id: e.target.value })}
                        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                      >
                        <option value="">Pilih produk</option>
                        {finishedProducts.map((p) => (
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
                        value={row.quantity}
                        onChange={(e) => updateOutputRow(i, { quantity: e.target.value })}
                        className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setOutputRows((prev) => prev.filter((_, idx) => idx !== i))}
                        disabled={outputRows.length === 1}
                        className="rounded-md border border-neutral-300 px-3 text-sm text-red-600 disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setOutputRows((prev) => [...prev, { ...emptyOutputRow }])}
                  className="mt-2 w-full rounded-md border border-dashed border-neutral-300 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  + Tambah Barang Jadi
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Catatan</label>
                <input
                  name="note"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {pending ? "Memproses..." : "Konfirmasi Produksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
