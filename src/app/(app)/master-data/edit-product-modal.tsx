"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProduct, type ProductFormState } from "./actions";

type Unit = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  category: string;
  business_model: string;
  unit_id: string;
  min_stock: number;
  price_retail: number | null;
  price_wholesale: number | null;
};

const initialState: ProductFormState = { error: null };

export function EditProductModal({ product, units }: { product: Product; units: Unit[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateProduct, initialState);

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the modal in response to the server action's result, not a derived render value
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-600 hover:underline"
      >
        Edit
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-neutral-900">Edit Produk</h3>

            <form action={formAction} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={product.id} />

              <div>
                <label className="block text-sm font-medium text-neutral-700">Nama Produk</label>
                <input
                  name="name"
                  required
                  defaultValue={product.name}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Kategori</label>
                  <select
                    name="category"
                    required
                    defaultValue={product.category}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="bahan_baku">Bahan Baku</option>
                    <option value="barang_jadi">Barang Jadi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Model Bisnis</label>
                  <select
                    name="business_model"
                    required
                    defaultValue={product.business_model}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="manufaktur">Manufaktur</option>
                    <option value="trading">Trading</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Satuan</label>
                  <select
                    name="unit_id"
                    required
                    defaultValue={product.unit_id}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Stok Minimum</label>
                  <input
                    name="min_stock"
                    type="number"
                    step="any"
                    min="0"
                    defaultValue={product.min_stock}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Harga Eceran</label>
                  <input
                    name="price_retail"
                    type="number"
                    step="any"
                    min="0"
                    defaultValue={product.price_retail ?? ""}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Harga Grosir</label>
                  <input
                    name="price_wholesale"
                    type="number"
                    step="any"
                    min="0"
                    defaultValue={product.price_wholesale ?? ""}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
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
                  {pending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
