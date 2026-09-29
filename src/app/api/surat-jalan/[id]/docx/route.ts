import { NextRequest, NextResponse } from "next/server";
import {
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
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

// Continuous 3-ply dot-matrix paper: 9.5 x 11 in per physical sheet, split
// into two form slots. The printer driver doesn't support a custom half-size
// paper form, so every page in the job is the same 9.5x11in the driver
// understands - the "half page" effect for a pair of half_page business
// units is done by fixing two table row heights inside ONE full-size page
// at exactly half the printable area each, so the second unit's content
// always starts right at the physical perforation regardless of how much
// content the first one has.
const PAGE_WIDTH_IN = 9.5;
const PAGE_HEIGHT_IN = 11;
const PAGE_MARGIN_IN = 0.35;
const HALF_ROW_HEIGHT_IN = PAGE_HEIGHT_IN / 2 - PAGE_MARGIN_IN;
const CONTENT_WIDTH_TWIP = convertInchesToTwip(PAGE_WIDTH_IN - 2 * PAGE_MARGIN_IN);
// TextRun size is in half-points, so 28 = 14pt.
const FONT_SIZE = 28;
const HEADING_FONT_SIZE = 32;
const FONT_NAME = "Arial";

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

// Border size is in eighths of a point, so 2 = 0.25pt (a thin hairline).
const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
};

type Row = {
  id: string;
  product_name: string;
  unit_name: string | null;
  quantity_sent: number;
  quantity_returned: number;
};
type Group = { unitName: string; halfPage: boolean; rows: Row[] };

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
  const safeOrder = order;

  const { data: items } = await supabase
    .from("delivery_order_items")
    .select(
      "id, quantity_sent, quantity_returned, products(name, units(name), business_unit_id, business_units(name, half_page))"
    )
    .eq("delivery_order_id", id);

  const rows = items ?? [];

  const groups = new Map<string, Group>();
  for (const r of rows) {
    const key = r.products?.business_unit_id ?? "lainnya";
    const unitName = r.products?.business_units?.name ?? "Lainnya";
    const halfPage = r.products?.business_units?.half_page ?? false;
    const group = groups.get(key) ?? { unitName, halfPage, rows: [] };
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

  const halfColWidth = Math.round(CONTENT_WIDTH_TWIP / 2);
  // Nama Barang gets the most room; Satuan/Quantity/Sisa are short values
  // that were sitting in columns with lots of wasted empty space.
  const itemColWidths = [
    Math.round(CONTENT_WIDTH_TWIP * 0.45),
    Math.round(CONTENT_WIDTH_TWIP * 0.15),
    Math.round(CONTENT_WIDTH_TWIP * 0.2),
    Math.round(CONTENT_WIDTH_TWIP * 0.2),
  ];

  function cell(
    text: string,
    opts: {
      bold?: boolean;
      align?: (typeof AlignmentType)[keyof typeof AlignmentType];
      width?: number;
    } = {}
  ) {
    return new TableCell({
      borders: cellBorder,
      verticalAlign: VerticalAlign.CENTER,
      width: opts.width != null ? { size: opts.width, type: WidthType.DXA } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: opts.align,
          children: [new TextRun({ text, bold: opts.bold, size: FONT_SIZE, font: FONT_NAME })],
        }),
      ],
    });
  }

  function buildGroupContent(group: Group): (Paragraph | Table)[] {
    const headerTable = new Table({
      width: { size: CONTENT_WIDTH_TWIP, type: WidthType.DXA },
      columnWidths: [halfColWidth, halfColWidth],
      borders: noBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorder,
              width: { size: halfColWidth, type: WidthType.DXA },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: group.unitName,
                      bold: true,
                      size: HEADING_FONT_SIZE,
                      font: FONT_NAME,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Surat Jalan No: ${safeOrder.code ?? ""}`,
                      size: FONT_SIZE,
                      font: FONT_NAME,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: noBorder,
              width: { size: halfColWidth, type: WidthType.DXA },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: `Tanggal   ${tanggal}`, size: FONT_SIZE, font: FONT_NAME }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `Tuan   ${safeOrder.companies?.name ?? ""}`,
                      size: FONT_SIZE,
                      font: FONT_NAME,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `Toko   ${safeOrder.destination_address || safeOrder.companies?.address || "-"}`,
                      size: FONT_SIZE,
                      font: FONT_NAME,
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
      width: { size: CONTENT_WIDTH_TWIP, type: WidthType.DXA },
      columnWidths: itemColWidths,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell("Nama Barang", { bold: true, width: itemColWidths[0] }),
            cell("Satuan", { bold: true, align: AlignmentType.CENTER, width: itemColWidths[1] }),
            cell("Quantity", { bold: true, align: AlignmentType.RIGHT, width: itemColWidths[2] }),
            cell("Sisa", { bold: true, align: AlignmentType.CENTER, width: itemColWidths[3] }),
          ],
        }),
        ...group.rows.map(
          (r) =>
            new TableRow({
              children: [
                cell(r.product_name, { width: itemColWidths[0] }),
                cell(r.unit_name ?? "", { align: AlignmentType.CENTER, width: itemColWidths[1] }),
                cell(String(r.quantity_sent), {
                  align: AlignmentType.RIGHT,
                  width: itemColWidths[2],
                }),
                cell(r.quantity_returned ? String(r.quantity_returned) : "", {
                  align: AlignmentType.CENTER,
                  width: itemColWidths[3],
                }),
              ],
            })
        ),
      ],
    });

    const footerTable = new Table({
      width: { size: CONTENT_WIDTH_TWIP, type: WidthType.DXA },
      columnWidths: [halfColWidth, halfColWidth],
      borders: noBorder,
      rows: [
        new TableRow({
          height: { value: 800, rule: HeightRule.ATLEAST },
          children: [
            new TableCell({
              borders: noBorder,
              width: { size: halfColWidth, type: WidthType.DXA },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Tanda Terima", size: FONT_SIZE, font: FONT_NAME }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: noBorder,
              width: { size: halfColWidth, type: WidthType.DXA },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: "Hormat Kami,", size: FONT_SIZE, font: FONT_NAME }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    return [headerTable, new Paragraph({ text: "" }), itemsTable, new Paragraph({ text: "" }), footerTable];
  }

  // Chunk groups into physical pages: two consecutive half_page groups
  // share one page (each pinned to exactly half its printable height);
  // anything else gets a page to itself.
  const pages: Group[][] = [];
  for (let i = 0; i < groupList.length; ) {
    const g = groupList[i];
    const next = groupList[i + 1];
    if (g.halfPage && next?.halfPage) {
      pages.push([g, next]);
      i += 2;
    } else {
      pages.push([g]);
      i += 1;
    }
  }

  const pageProperties = {
    type: "nextPage" as const,
    page: {
      size: {
        width: convertInchesToTwip(PAGE_WIDTH_IN),
        height: convertInchesToTwip(PAGE_HEIGHT_IN),
      },
      margin: {
        top: convertInchesToTwip(PAGE_MARGIN_IN),
        bottom: convertInchesToTwip(PAGE_MARGIN_IN),
        left: convertInchesToTwip(PAGE_MARGIN_IN),
        right: convertInchesToTwip(PAGE_MARGIN_IN),
      },
    },
  };

  const sections = pages.map((pageGroups) => {
    if (pageGroups.length === 2) {
      const splitTable = new Table({
        width: { size: CONTENT_WIDTH_TWIP, type: WidthType.DXA },
        columnWidths: [CONTENT_WIDTH_TWIP],
        borders: noBorder,
        rows: pageGroups.map(
          (g) =>
            new TableRow({
              height: { value: convertInchesToTwip(HALF_ROW_HEIGHT_IN), rule: HeightRule.EXACT },
              children: [
                new TableCell({
                  borders: noBorder,
                  width: { size: CONTENT_WIDTH_TWIP, type: WidthType.DXA },
                  children: buildGroupContent(g),
                }),
              ],
            })
        ),
      });

      return { properties: pageProperties, children: [splitTable] };
    }

    return { properties: pageProperties, children: buildGroupContent(pageGroups[0]) };
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_NAME },
        },
      },
    },
    sections:
      sections.length > 0
        ? sections
        : [{ properties: pageProperties, children: [new Paragraph("Belum ada barang.")] }],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${order.code ?? "surat-jalan"}.docx"`,
    },
  });
}
