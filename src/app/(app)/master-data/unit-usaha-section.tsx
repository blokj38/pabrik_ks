import { createClient } from "@/lib/supabase/server";
import { deleteBusinessUnit } from "./actions";
import { CreateBusinessUnitForm } from "./create-business-unit-form";
import { DeleteButton } from "./delete-button";
import { HalfPageToggle } from "./half-page-toggle";
import { SortOrderInput } from "./sort-order-input";

export async function UnitUsahaSection() {
  const supabase = await createClient();
  const { data: businessUnits } = await supabase
    .from("business_units")
    .select("id, name, address, half_page, sort_order")
    .order("sort_order")
    .order("name");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:col-span-1">
        <h2 className="text-sm font-semibold text-neutral-900">Tambah Unit Usaha</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Kop surat yang dicetak per unit usaha saat menerbitkan Surat Jalan (mis. Kecap, Garam,
          Kerupuk & Mie).
        </p>
        <div className="mt-3">
          <CreateBusinessUnitForm />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white lg:col-span-2">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-center">Urutan</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Alamat</th>
              <th className="px-4 py-3 text-center">Setengah Halaman</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(businessUnits ?? []).map((bu) => (
              <tr key={bu.id}>
                <td className="px-4 py-3">
                  <SortOrderInput businessUnitId={bu.id} initialValue={bu.sort_order} />
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">{bu.name}</td>
                <td className="px-4 py-3 text-neutral-600">{bu.address ?? "-"}</td>
                <td className="px-4 py-3 text-center">
                  <HalfPageToggle businessUnitId={bu.id} initialValue={bu.half_page} />
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton
                    action={deleteBusinessUnit.bind(null, bu.id)}
                    confirmMessage={`Hapus unit usaha "${bu.name}"?`}
                  />
                </td>
              </tr>
            ))}
            {(businessUnits ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Belum ada unit usaha.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
