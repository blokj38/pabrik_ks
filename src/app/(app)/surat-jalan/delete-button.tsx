"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDeliveryOrder } from "./actions";

export function DeleteDeliveryOrderButton({
  deliveryOrderId,
  code,
  redirectTo,
}: {
  deliveryOrderId: string;
  code: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (
      !window.confirm(
        `Hapus surat jalan ${code}? Kalau statusnya sudah diterbitkan, stok yang sudah terpotong akan dikembalikan. Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteDeliveryOrder(deliveryOrderId);
      if (res.error) {
        setError(res.error);
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleDelete}
        disabled={pending}
        className="text-xs text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Menghapus..." : "Hapus"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
