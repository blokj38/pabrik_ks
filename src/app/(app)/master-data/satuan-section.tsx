import { createClient } from "@/lib/supabase/server";
import { deleteUnit } from "./actions";
import { CreateUnitForm } from "./create-unit-form";
import { DeleteButton } from "./delete-button";

export async function SatuanSection() {
  const supabase = await createClient();
  const { data: units } = await supabase.from("units").select("id, name").order("name");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:col-span-1">
        <h2 className="text-sm font-semibold text-neutral-900">Tambah Satuan</h2>
        <div className="mt-3">
          <CreateUnitForm />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white lg:col-span-2">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(units ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-neutral-800">{u.name}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton
                    action={deleteUnit.bind(null, u.id)}
                    confirmMessage={`Hapus satuan "${u.name}"?`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
