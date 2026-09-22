"use client";

import { useActionState, useEffect, useState } from "react";
import { updateDeliveryOrderHeader, type DeliveryOrderState } from "../actions";

type Company = { id: string; name: string };

const initialState: DeliveryOrderState = { error: null };

export function EditHeaderModal({
  deliveryOrderId,
  companies,
  initialCustomerId,
  initialDriverName,
  initialVehicle,
  initialDestinationAddress,
}: {
  deliveryOrderId: string;
  companies: Company[];
  initialCustomerId: string;
  initialDriverName: string;
  initialVehicle: string;
  initialDestinationAddress: string;
}) {
  const [open, setOpen] = useState(false);
  const boundAction = updateDeliveryOrderHeader.bind(null, deliveryOrderId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the modal in response to the server action's result, not a derived render value
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
      >
        Edit Info Pengiriman
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-neutral-900">Edit Info Pengiriman</h3>

            <form action={formAction} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Pelanggan</label>
                <select
                  name="customer_id"
                  required
                  defaultValue={initialCustomerId}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Nama Supir</label>
                <input
                  name="driver_name"
                  defaultValue={initialDriverName}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Armada</label>
                <input
                  name="vehicle"
                  defaultValue={initialVehicle}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Alamat Tujuan
                </label>
                <input
                  name="destination_address"
                  defaultValue={initialDestinationAddress}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {pending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
