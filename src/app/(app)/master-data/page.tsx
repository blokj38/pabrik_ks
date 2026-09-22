import Link from "next/link";
import { ProdukSection } from "./produk-section";
import { PerusahaanSection } from "./perusahaan-section";
import { ResepSection } from "./resep-section";
import { SatuanSection } from "./satuan-section";
import { UnitUsahaSection } from "./unit-usaha-section";

const TABS = [
  { key: "produk", label: "Produk" },
  { key: "perusahaan", label: "Perusahaan" },
  { key: "resep", label: "Resep (BOM)" },
  { key: "satuan", label: "Satuan" },
  { key: "unit-usaha", label: "Unit Usaha" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function MasterDataPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = (TABS.find((t) => t.key === tab)?.key ?? "produk") as TabKey;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Master Data</h1>
        <p className="text-sm text-neutral-500">
          Kelola produk, perusahaan, resep produksi, dan satuan.
        </p>
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/master-data?tab=${t.key}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === t.key
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "produk" ? <ProdukSection /> : null}
      {activeTab === "perusahaan" ? <PerusahaanSection /> : null}
      {activeTab === "resep" ? <ResepSection /> : null}
      {activeTab === "satuan" ? <SatuanSection /> : null}
      {activeTab === "unit-usaha" ? <UnitUsahaSection /> : null}
    </div>
  );
}
