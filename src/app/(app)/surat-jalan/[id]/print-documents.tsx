"use client";

import { useState } from "react";

type Row = {
  id: string;
  product_name: string;
  unit_name: string | null;
  quantity_sent: number;
  quantity_returned: number;
};

type Group = {
  key: string;
  unitName: string;
  rows: Row[];
};

export function PrintDocuments({
  groups,
  code,
  tanggal,
  customerName,
  destination,
}: {
  groups: Group[];
  code: string;
  tanggal: string;
  customerName: string | null | undefined;
  destination: string;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.key, true]))
  );

  const toggle = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleGroups = groups.filter((g) => selected[g.key] ?? true);

  return (
    <>
      {groups.length > 1 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 print:hidden">
          <p className="text-sm font-medium text-neutral-700">Kop yang akan dicetak:</p>
          <div className="mt-2 flex flex-wrap gap-4">
            {groups.map((g) => (
              <label key={g.key} className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={selected[g.key] ?? true}
                  onChange={() => toggle(g.key)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                {g.unitName}
              </label>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            disabled={visibleGroups.length === 0}
            className="mt-3 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
          >
            Cetak ({visibleGroups.length} kop)
          </button>
        </div>
      ) : (
        <div className="print:hidden">
          <button
            onClick={() => window.print()}
            disabled={visibleGroups.length === 0}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
          >
            Cetak
          </button>
        </div>
      )}

      {visibleGroups.map((group, i) => (
        <div
          key={group.key}
          className={`rounded-lg border border-neutral-200 bg-white p-6 print:rounded-none print:border-0 print:p-0 ${
            i < visibleGroups.length - 1 ? "print:break-after-page" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">{group.unitName}</h2>
              <p className="mt-2 text-sm">Surat Jalan No: {code}</p>
            </div>
            <div className="text-right text-sm">
              <p>
                Tanggal <span className="ml-4">{tanggal}</span>
              </p>
              <p>
                Tuan <span className="ml-4">{customerName}</span>
              </p>
              <p>
                Toko <span className="ml-4">{destination || "-"}</span>
              </p>
            </div>
          </div>

          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border border-neutral-900">
                <th className="border border-neutral-900 px-2 py-1 text-left">Nama Barang</th>
                <th className="border border-neutral-900 px-2 py-1 text-center">Satuan</th>
                <th className="border border-neutral-900 px-2 py-1 text-right">Quantity</th>
                <th className="border border-neutral-900 px-2 py-1 text-center">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((r) => (
                <tr key={r.id}>
                  <td className="border border-neutral-900 px-2 py-1">{r.product_name}</td>
                  <td className="border border-neutral-900 px-2 py-1 text-center">
                    {r.unit_name}
                  </td>
                  <td className="border border-neutral-900 px-2 py-1 text-right">
                    {r.quantity_sent}
                  </td>
                  <td className="border border-neutral-900 px-2 py-1 text-center">
                    {r.quantity_returned || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-10 flex justify-between text-sm">
            <p>Tanda Terima</p>
            <p>Hormat Kami,</p>
          </div>
          <div className="h-16" />
        </div>
      ))}

      {visibleGroups.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          Tidak ada kop yang dipilih untuk dicetak.
        </div>
      ) : null}
    </>
  );
}
