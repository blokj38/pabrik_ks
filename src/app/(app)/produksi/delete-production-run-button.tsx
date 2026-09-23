"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductionRun } from "./actions";

export function DeleteProductionRunButton({
  productionRunId,
  productName,
}: {
  productionRunId: string;
  productName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (
      !window.confirm(
        `Hapus riwayat produksi "${productName}"? Hasil produksi akan dikurangi lagi dari stok, dan bahan baku yang terpakai akan dikembalikan.`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteProductionRun(productionRunId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={handleDelete}
        disabled={pending}
        className="text-xs text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Menghapus..." : "Hapus"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
