"use client";

import { useActionState, useState } from "react";
import { createDeliveryOrder, type DeliveryOrderState } from "../actions";

type Company = { id: string; name: string };
type Product = { id: string; name: string; unit_name: string | null };

type Row = { product_id: string; quantity_sent: string; unit_price: string };

const initialState: DeliveryOrderState = { error: null };
const emptyRow: Row = { product_id: "", quantity_sent: "", unit_price: "" };

export function NewDeliveryForm({
  companies,
  products,
}: {
  companies: Company[];
  products: Product[];
}) {
  const [state, formAction, pending] = useActionState(createDeliveryOrder, initialState);
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const itemsJson = JSON.stringify(
    rows
      .filter((r) => r.product_id && Number(r.quantity_sent) > 0)
      .map((r) => ({
        product_id: r.product_id,
        quantity_sent: Number(r.quantity_sent),
        unit_price: r.unit_price ? Number(r.unit_price) : undefined,
      }))
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="items" value={itemsJson} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Pelanggan</label>
          <select
            name="customer_id"
            required
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Pilih pelanggan</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Nama Supir</label>
          <input
            name="driver_name"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Armada</label>
          <input
            name="vehicle"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Alamat Tujuan</label>
          <input
            name="destination_address"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Barang</p>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={row.product_id}
                onChange={(e) => updateRow(i, { product_id: e.target.value })}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Pilih produk</option>
                {products.map((p) => (
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
                value={row.quantity_sent}
                onChange={(e) => updateRow(i, { quantity_sent: e.target.value })}
                className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Harga/unit"
                value={row.unit_price}
                onChange={(e) => updateRow(i, { unit_price: e.target.value })}
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
          + Tambah Barang
        </button>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan sebagai Draft"}
      </button>
    </form>
  );
}
