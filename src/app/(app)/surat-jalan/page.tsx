import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  diterbitkan: "Diterbitkan",
  dalam_pengiriman: "Dalam Pengiriman",
  selesai: "Selesai",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  diterbitkan: "bg-amber-100 text-amber-700",
  dalam_pengiriman: "bg-blue-100 text-blue-700",
  selesai: "bg-emerald-100 text-emerald-700",
};

export default async function SuratJalanPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("delivery_orders")
    .select("id, code, status, driver_name, created_at, companies(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Surat Jalan</h1>
          <p className="text-sm text-neutral-500">Daftar pengiriman & status terkini.</p>
        </div>
        <Link
          href="/surat-jalan/baru"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Buat Surat Jalan
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">No. Surat Jalan</th>
              <th className="px-4 py-3">Pelanggan</th>
              <th className="px-4 py-3">Supir</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="cursor-pointer hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/surat-jalan/${o.id}`} className="font-medium text-neutral-900">
                    {o.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">{o.companies?.name ?? "-"}</td>
                <td className="px-4 py-3 text-neutral-600">{o.driver_name ?? "-"}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {new Date(o.created_at).toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status]}`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                </td>
              </tr>
            ))}
            {(orders ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Belum ada surat jalan.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
