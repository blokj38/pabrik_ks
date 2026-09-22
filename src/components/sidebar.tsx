import Link from "next/link";
import { logout } from "@/app/logout/actions";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/stok", label: "Stok" },
  { href: "/produksi", label: "Produksi" },
  { href: "/surat-jalan", label: "Surat Jalan" },
  { href: "/laporan", label: "Laporan" },
  { href: "/master-data", label: "Master Data" },
];

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin_gudang: "Admin Gudang",
  operator_produksi: "Operator Produksi",
  kasir_sales: "Kasir / Sales",
};

export function Sidebar({
  fullName,
  role,
}: {
  fullName: string | null;
  role: string;
}) {
  return (
    <aside className="print:hidden flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-5">
        <p className="text-sm font-semibold text-neutral-900">FIMS</p>
        <p className="text-xs text-neutral-500">Pabrik Kecap, Garam & Kerupuk</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-neutral-200 px-4 py-4">
        <p className="truncate text-sm font-medium text-neutral-900">
          {fullName ?? "Pengguna"}
        </p>
        <p className="text-xs text-neutral-500">{ROLE_LABEL[role] ?? role}</p>
        <form action={logout} className="mt-3">
          <button
            type="submit"
            className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
