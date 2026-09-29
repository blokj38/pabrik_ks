"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setBusinessUnitSortOrder } from "./actions";

export function SortOrderInput({
  businessUnitId,
  initialValue,
}: {
  businessUnitId: string;
  initialValue: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-center gap-2">
      <input
        type="number"
        defaultValue={initialValue}
        disabled={pending}
        onBlur={(e) => {
          setError(null);
          const value = Number(e.target.value) || 0;
          if (value === initialValue) return;
          startTransition(async () => {
            const res = await setBusinessUnitSortOrder(businessUnitId, value);
            if (res.error) setError(res.error);
            else router.refresh();
          });
        }}
        className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-sm text-center"
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
