import { createClient } from "@/lib/supabase/server";
import { deleteCompany } from "./actions";
import { CreateCompanyForm } from "./create-company-form";

const TYPE_LABEL: Record<string, string> = {
  customer: "Pelanggan",
  supplier: "Supplier",
  both: "Keduanya",
};

export async function PerusahaanSection() {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, code, type, address, phone")
    .order("name");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:col-span-1">
        <h2 className="text-sm font-semibold text-neutral-900">Tambah Perusahaan</h2>
        <div className="mt-3">
          <CreateCompanyForm />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white lg:col-span-2">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Kontak</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(companies ?? []).map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{c.name}</p>
                  <p className="text-xs text-neutral-500">{c.address}</p>
                </td>
                <td className="px-4 py-3 text-neutral-600">{TYPE_LABEL[c.type]}</td>
                <td className="px-4 py-3 text-neutral-600">{c.phone ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteCompany.bind(null, c.id)}>
                    <button className="text-xs text-red-600 hover:underline">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
            {(companies ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  Belum ada data.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
