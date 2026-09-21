"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { runProductionAction, type ProductionState } from "./actions";

type Ingredient = { name: string; quantity_per_unit: number; unit_name: string | null };

const initialState: ProductionState = { error: null };

export function ProductionModal({
  recipeId,
  recipeName,
  finishedUnitName,
  ingredients,
}: {
  recipeId: string;
  recipeName: string;
  finishedUnitName: string | null;
  ingredients: Ingredient[];
}) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, pending] = useActionState(runProductionAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the modal in response to the server action's result, not a derived render value
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Jumlah diproduksi {finishedUnitName ? `(${finishedUnitName})` : ""}
                </label>
                <input
                  name="quantity"
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
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
                        {(ing.quantity_per_unit * quantity).toLocaleString("id-ID")}{" "}
                        {ing.unit_name}
                      </span>
                    </li>
                  ))}
                </ul>
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
