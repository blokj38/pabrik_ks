"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBusinessUnit, type FormState } from "./actions";

const initialState: FormState = { error: null };

export function CreateBusinessUnitForm() {
  const [state, formAction, pending] = useActionState(createBusinessUnit, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Nama Unit Usaha (kop surat)
        </label>
        <input
          name="name"
          placeholder="Perusahaan Kecap KS"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Alamat (opsional)</label>
        <input
          name="address"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        Tambah Unit Usaha
      </button>
    </form>
  );
}
