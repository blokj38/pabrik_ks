"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCompany, type FormState } from "./actions";

const initialState: FormState = { error: null };

export function CreateCompanyForm() {
  const [state, formAction, pending] = useActionState(createCompany, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-neutral-700">Nama</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Kode</label>
          <input
            name="code"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Tipe</label>
          <select
            name="type"
            defaultValue="customer"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="customer">Pelanggan</option>
            <option value="supplier">Supplier</option>
            <option value="both">Keduanya</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Alamat</label>
        <input
          name="address"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Telepon</label>
        <input
          name="phone"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        Tambah Perusahaan
      </button>
    </form>
  );
}
