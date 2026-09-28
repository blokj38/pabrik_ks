"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setBusinessUnitHalfPage } from "./actions";

export function HalfPageToggle({
  businessUnitId,
  initialValue,
}: {
  businessUnitId: string;
  initialValue: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-center gap-2">
      <input
        type="checkbox"
        defaultChecked={initialValue}
        disabled={pending}
        onChange={(e) => {
          setError(null);
          const checked = e.target.checked;
          startTransition(async () => {
            const res = await setBusinessUnitHalfPage(businessUnitId, checked);
            if (res.error) setError(res.error);
            else router.refresh();
          });
        }}
        className="h-4 w-4 rounded border-neutral-300"
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
