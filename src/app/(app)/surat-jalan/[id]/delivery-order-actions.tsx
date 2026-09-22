"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeDeliveryOrder, issueDeliveryOrder } from "../actions";

type Item = { id: string; product_name: string; quantity_sent: number; unit_name: string | null };

export function DeliveryOrderActions({
  deliveryOrderId,
  status,
  items,
}: {
  deliveryOrderId: string;
  status: string;
  items: Item[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [returns, setReturns] = useState<Record<string, string>>({});

  const handleIssue = () => {
    setError(null);
    startTransition(async () => {
      const res = await issueDeliveryOrder(deliveryOrderId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  const handleComplete = () => {
    setError(null);
    const payload = items.map((it) => ({
      item_id: it.id,
      quantity_returned: Number(returns[it.id] ?? 0),
    }));
    startTransition(async () => {
      const res = await completeDeliveryOrder(deliveryOrderId, payload);
      if (res.error) setError(res.error);
      else {
        setShowComplete(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="print:hidden space-y-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-2">
        {status === "draft" ? (
          <button
            onClick={handleIssue}
            disabled={pending}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "Memproses..." : "Terbitkan (potong stok)"}
          </button>
        ) : null}

        {(status === "diterbitkan" || status === "dalam_pengiriman") ? (
          <button
            onClick={() => setShowComplete(true)}
            disabled={pending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Selesaikan Pengiriman
          </button>
        ) : null}
      </div>

      {showComplete ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="mb-2 text-sm font-medium text-neutral-700">
            Jumlah barang retur (jika ada):
          </p>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-neutral-700">{it.product_name}</span>
                <input
                  type="number"
                  min="0"
                  max={it.quantity_sent}
                  step="any"
                  placeholder="0"
                  value={returns[it.id] ?? ""}
                  onChange={(e) =>
                    setReturns((prev) => ({ ...prev, [it.id]: e.target.value }))
                  }
                  className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm text-right"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowComplete(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Batal
            </button>
            <button
              onClick={handleComplete}
              disabled={pending}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {pending ? "Memproses..." : "Konfirmasi Selesai"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
