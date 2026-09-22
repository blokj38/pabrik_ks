"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addDeliveryOrderItem, editDeliveryOrderItem, removeDeliveryOrderItem } from "../actions";

type Item = {
  id: string;
  product_id: string;
  product_name: string;
  unit_name: string | null;
  quantity_sent: number;
  unit_price: number | null;
};
type Product = { id: string; name: string; unit_name: string | null };

export function IssuedItemsEditor({
  deliveryOrderId,
  items,
  products,
}: {
  deliveryOrderId: string;
  items: Item[];
  products: Product[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ product_id: "", quantity_sent: "", unit_price: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ product_id: "", quantity_sent: "", unit_price: "" });

  const startEdit = (item: Item) => {
    setError(null);
    setEditingId(item.id);
    setEditForm({
      product_id: item.product_id,
      quantity_sent: String(item.quantity_sent),
      unit_price: item.unit_price != null ? String(item.unit_price) : "",
    });
  };

  const saveEdit = (itemId: string) => {
    setError(null);
    const productId = editForm.product_id;
    const quantity = Number(editForm.quantity_sent);
    const unitPrice = editForm.unit_price ? Number(editForm.unit_price) : null;
    if (!productId || !quantity || quantity <= 0) {
      setError("Produk dan jumlah wajib diisi.");
      return;
    }
    startTransition(async () => {
      const res = await editDeliveryOrderItem(itemId, productId, quantity, unitPrice);
      if (res.error) setError(res.error);
      else {
        setEditingId(null);
        router.refresh();
      }
    });
  };

  const removeItem = (item: Item) => {
    if (!window.confirm(`Hapus "${item.product_name}" dari surat jalan ini? Stok akan dikembalikan.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await removeDeliveryOrderItem(item.id);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  const saveAdd = () => {
    setError(null);
    const productId = addForm.product_id;
    const quantity = Number(addForm.quantity_sent);
    const unitPrice = addForm.unit_price ? Number(addForm.unit_price) : null;
    if (!productId || !quantity || quantity <= 0) {
      setError("Produk dan jumlah wajib diisi.");
      return;
    }
    startTransition(async () => {
      const res = await addDeliveryOrderItem(deliveryOrderId, productId, quantity, unitPrice);
      if (res.error) setError(res.error);
      else {
        setShowAdd(false);
        setAddForm({ product_id: "", quantity_sent: "", unit_price: "" });
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 print:hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Edit Barang</h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs font-medium text-neutral-700 hover:underline"
        >
          {showAdd ? "Batal tambah" : "+ Tambah Barang"}
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 divide-y divide-neutral-100">
        {items.map((item) => (
          <div key={item.id} className="py-2">
            {editingId === item.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={editForm.product_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, product_id: e.target.value }))}
                  className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                >
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
                  value={editForm.quantity_sent}
                  onChange={(e) => setEditForm((f) => ({ ...f, quantity_sent: e.target.value }))}
                  className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Harga/unit"
                  value={editForm.unit_price}
                  onChange={(e) => setEditForm((f) => ({ ...f, unit_price: e.target.value }))}
                  className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  onClick={() => saveEdit(item.id)}
                  disabled={pending}
                  className="rounded-md bg-neutral-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  Simpan
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-800">
                  {item.product_name} — {item.quantity_sent} {item.unit_name}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-xs text-neutral-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeItem(item)}
                    disabled={pending}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
          <select
            value={addForm.product_id}
            onChange={(e) => setAddForm((f) => ({ ...f, product_id: e.target.value }))}
            className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
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
            value={addForm.quantity_sent}
            onChange={(e) => setAddForm((f) => ({ ...f, quantity_sent: e.target.value }))}
            className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            step="any"
            min="0"
            placeholder="Harga/unit"
            value={addForm.unit_price}
            onChange={(e) => setAddForm((f) => ({ ...f, unit_price: e.target.value }))}
            className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={saveAdd}
            disabled={pending}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            Simpan
          </button>
        </div>
      ) : null}
    </div>
  );
}
