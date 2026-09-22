"use client";

import { useActionState, useEffect, useRef } from "react";
import { createProduct, type FormState } from "./actions";

type Unit = { id: string; name: string };
type BusinessUnit = { id: string; name: string };

const initialState: FormState = { error: null };

export function CreateProductForm({
  units,
  businessUnits,
}: {
  units: Unit[];
  businessUnits: BusinessUnit[];
}) {
  const [state, formAction, pending] = useActionState(createProduct, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-neutral-700">Nama Produk</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Kategori</label>
          <select
            name="category"
            required
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
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Pilih satuan</option>
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
            defaultValue={0}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Unit Usaha (kop surat jalan)
        </label>
        <select
          name="business_unit_id"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">- Tidak ditentukan -</option>
          {businessUnits.map((bu) => (
            <option key={bu.id} value={bu.id}>
              {bu.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Harga Eceran</label>
          <input
            name="price_retail"
            type="number"
            step="any"
            min="0"
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
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        Tambah Produk
      </button>
    </form>
  );
}
