"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createStockMovement, type StockMovementState } from "./actions";

type Product = {
  id: string;
  name: string;
  category: "bahan_baku" | "barang_jadi";
  unit_name: string | null;
};

const initialState: StockMovementState = { error: null };

const CATEGORY_LABEL: Record<"semua" | "bahan_baku" | "barang_jadi", string> = {
  semua: "Semua",
  bahan_baku: "Bahan Baku",
  barang_jadi: "Barang Jadi",
};

export function StockMovementModal({ products }: { products: Product[] }) {
  const [open, setOpen] = useState<"masuk" | "keluar" | null>(null);
  const [category, setCategory] = useState<"semua" | "bahan_baku" | "barang_jadi">("semua");
  const [state, formAction, pending] = useActionState(createStockMovement, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const filteredProducts =
    category === "semua" ? products : products.filter((p) => p.category === category);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the modal in response to the server action's result, not a derived render value
      setOpen(null);
    }
  }, [state.success]);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setOpen("masuk")}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Stok Masuk
        </button>
        <button
          onClick={() => setOpen("keluar")}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          − Stok Keluar
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-neutral-900">
              {open === "masuk" ? "Stok Masuk" : "Stok Keluar"}
            </h3>

            <form ref={formRef} action={formAction} className="mt-4 space-y-3">
              <input type="hidden" name="direction" value={open} />

              <div>
                <label className="block text-sm font-medium text-neutral-700">Kategori</label>
                <div className="mt-1 flex gap-1">
                  {(["semua", "bahan_baku", "barang_jadi"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium ${
                        category === c
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      {CATEGORY_LABEL[c]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Produk</label>
                <select
                  name="product_id"
                  required
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">Pilih produk</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.unit_name ? `(${p.unit_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Jumlah</label>
                <input
                  name="quantity"
                  type="number"
                  step="any"
                  min="0"
                  required
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              {open === "masuk" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      No. Batch
                    </label>
                    <input
                      name="batch_number"
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      Kadaluarsa
                    </label>
                    <input
                      name="expired_date"
                      type="date"
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ) : null}

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
                  onClick={() => setOpen(null)}
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
