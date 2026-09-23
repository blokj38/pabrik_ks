"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DeleteState } from "./actions";

export function DeleteButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<DeleteState>;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={pending}
        className="text-xs text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Menghapus..." : "Hapus"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
