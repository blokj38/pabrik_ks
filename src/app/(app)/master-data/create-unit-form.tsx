"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUnit, type FormState } from "./actions";

const initialState: FormState = { error: null };

export function CreateUnitForm() {
  const [state, formAction, pending] = useActionState(createUnit, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex gap-2">
      <input
        name="name"
        placeholder="Kg, Liter, Botol, ..."
        required
        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        Tambah
      </button>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
    </form>
  );
}
