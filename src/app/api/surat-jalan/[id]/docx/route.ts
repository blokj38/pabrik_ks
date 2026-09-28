import { NextRequest, NextResponse } from "next/server";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { createClient } from "@/lib/supabase/server";

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("delivery_orders")
    .select(
      "id, code, customer_id, driver_name, vehicle, destination_address, departure_date, created_at, companies(name, address)"
    )
    .eq("id", id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Surat jalan tidak ditemukan" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("delivery_order_items")
    .select(
      "id, quantity_sent, quantity_returned, products(name, units(name), business_unit_id, business_units(name))"
    )
    .eq("delivery_order_id", id);

  const rows = items ?? [];

  type Row = {
    id: string;
    product_name: string;
    unit_name: string | null;
    quantity_sent: number;
    quantity_returned: number;
  };
  const groups = new Map<string, { unitName: string; rows: Row[] }>();
  for (const r of rows) {
    const key = r.products?.business_unit_id ?? "lainnya";
    const unitName = r.products?.business_units?.name ?? "Lainnya";
    const group = groups.get(key) ?? { unitName, rows: [] };
    group.rows.push({
      id: r.id,
      product_name: r.products?.name ?? "-",
      unit_name: r.products?.units?.name ?? null,
      quantity_sent: r.quantity_sent,
      quantity_returned: r.quantity_returned,
    });
    groups.set(key, group);
  }
  const groupList = Array.from(groups.values());

  const tanggal = new Date(order.departure_date ?? order.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  function cell(text: string, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
    return new TableCell({
      borders: cellBorder,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: opts.align,
          children: [new TextRun({ text, bold: opts.bold })],
        }),
      ],
    });
  }

  const sections = groupList.map((group, i) => {
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorder,
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: group.unitName, bold: true, size: 28 })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Surat Jalan No: ${order.code ?? ""}` })],
                }),
              ],
            }),
            new TableCell({
              borders: noBorder,
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: `Tanggal   ${tanggal}` })],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: `Tuan   ${order.companies?.name ?? ""}` })],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `Toko   ${order.destination_address || order.companies?.address || "-"}`,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const itemsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell("Nama Barang", { bold: true }),
            cell("Satuan", { bold: true, align: AlignmentType.CENTER }),
            cell("Quantity", { bold: true, align: AlignmentType.RIGHT }),
            cell("Sisa", { bold: true, align: AlignmentType.CENTER }),
          ],
        }),
        ...group.rows.map(
          (r) =>
            new TableRow({
              children: [
                cell(r.product_name),
                cell(r.unit_name ?? "", { align: AlignmentType.CENTER }),
                cell(String(r.quantity_sent), { align: AlignmentType.RIGHT }),
                cell(r.quantity_returned ? String(r.quantity_returned) : "", {
                  align: AlignmentType.CENTER,
                }),
              ],
            })
        ),
      ],
    });

    const footerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorder,
      rows: [
        new TableRow({
          height: { value: 1200, rule: HeightRule.ATLEAST },
          children: [
            new TableCell({
              borders: noBorder,
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "Tanda Terima" })] })],
            }),
            new TableCell({
              borders: noBorder,
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: "Hormat Kami," })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    return {
      properties: i > 0 ? { type: "nextPage" as const } : undefined,
      children: [
        headerTable,
        new Paragraph({ text: "" }),
        itemsTable,
        new Paragraph({ text: "" }),
        footerTable,
      ],
    };
  });

  const doc = new Document({
    sections: sections.length > 0 ? sections : [{ children: [new Paragraph("Belum ada barang.")] }],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${order.code ?? "surat-jalan"}.docx"`,
    },
  });
}
