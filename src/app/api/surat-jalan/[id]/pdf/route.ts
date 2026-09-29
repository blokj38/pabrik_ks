import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createClient } from "@/lib/supabase/server";

// Continuous 3-ply dot-matrix paper: 9.5 x 11 in per physical sheet, split
// into two form slots. Unlike the .docx export (which has to fake half-page
// positioning with a fixed-height table row because Word measures things in
// its own layout units), PDF coordinates are absolute points, so a paired
// half_page unit's content is simply drawn starting exactly at the
// half-page Y coordinate - no ambiguity, no nested-table quirks.
const PAGE_WIDTH_PT = 9.5 * 72;
const PAGE_HEIGHT_PT = 11 * 72;
const MARGIN_PT = 0.35 * 72;
const HALF_PAGE_PT = PAGE_HEIGHT_PT / 2;
const FONT_SIZE = 14;
const HEADING_SIZE = 16;

type Row = {
  id: string;
  product_name: string;
  unit_name: string | null;
  quantity_sent: number;
  quantity_returned: number;
};
type Group = { unitName: string; halfPage: boolean; sortOrder: number; rows: Row[] };
type OrderInfo = {
  code: string | null;
  companyName: string | null | undefined;
  destination: string;
};

type Column = { width: number; align: "left" | "center" | "right"; label: string };

function drawTableRow(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  columns: Column[],
  values: string[],
  bold: boolean
) {
  const rowHeight = FONT_SIZE + 8;
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(FONT_SIZE);
  let curX = x;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    doc.rect(curX, y, col.width, rowHeight).stroke();
    doc.text(values[i] ?? "", curX + 4, y + 4, {
      width: col.width - 8,
      align: col.align,
      lineBreak: false,
    });
    curX += col.width;
  }
  return y + rowHeight;
}

function drawGroupBlock(
  doc: PDFKit.PDFDocument,
  group: Group,
  order: OrderInfo,
  tanggal: string,
  startY: number
) {
  const leftX = MARGIN_PT;
  const contentWidth = PAGE_WIDTH_PT - 2 * MARGIN_PT;
  const halfWidth = contentWidth / 2;
  const rightX = leftX + halfWidth;

  let y = startY;

  doc.font("Helvetica-Bold").fontSize(HEADING_SIZE);
  const headingHeight = doc.heightOfString(group.unitName, { width: halfWidth });
  doc.text(group.unitName, leftX, y, { width: halfWidth });

  doc.font("Helvetica").fontSize(FONT_SIZE);
  doc.text(`Tanggal   ${tanggal}`, rightX, y, { width: halfWidth, align: "right" });

  y += headingHeight + 2;

  doc.text(`Surat Jalan No: ${order.code ?? ""}`, leftX, y, { width: halfWidth });
  doc.text(`Tuan   ${order.companyName ?? ""}`, rightX, y, { width: halfWidth, align: "right" });

  y += FONT_SIZE + 4;
  doc.text(`Toko   ${order.destination || "-"}`, rightX, y, { width: halfWidth, align: "right" });

  y += FONT_SIZE + 12;

  const columns: Column[] = [
    { width: contentWidth * 0.45, align: "left", label: "Nama Barang" },
    { width: contentWidth * 0.15, align: "center", label: "Satuan" },
    { width: contentWidth * 0.2, align: "right", label: "Quantity" },
    { width: contentWidth * 0.2, align: "center", label: "Sisa" },
  ];

  y = drawTableRow(
    doc,
    leftX,
    y,
    columns,
    columns.map((c) => c.label),
    true
  );
  for (const r of group.rows) {
    y = drawTableRow(
      doc,
      leftX,
      y,
      columns,
      [
        r.product_name,
        r.unit_name ?? "",
        String(r.quantity_sent),
        r.quantity_returned ? String(r.quantity_returned) : "",
      ],
      false
    );
  }

  y += 24;
  doc.font("Helvetica").fontSize(FONT_SIZE);
  doc.text("Tanda Terima", leftX, y);
  doc.text("Hormat Kami,", rightX, y, { width: halfWidth, align: "right" });

  return y + FONT_SIZE + 4;
}

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
      "id, quantity_sent, quantity_returned, products(name, units(name), business_unit_id, business_units(name, half_page, sort_order))"
    )
    .eq("delivery_order_id", id);

  const rows = items ?? [];

  const groups = new Map<string, Group>();
  for (const r of rows) {
    const key = r.products?.business_unit_id ?? "lainnya";
    const unitName = r.products?.business_units?.name ?? "Lainnya";
    const halfPage = r.products?.business_units?.half_page ?? false;
    const sortOrder = r.products?.business_units?.sort_order ?? 0;
    const group = groups.get(key) ?? { unitName, halfPage, sortOrder, rows: [] };
    group.rows.push({
      id: r.id,
      product_name: r.products?.name ?? "-",
      unit_name: r.products?.units?.name ?? null,
      quantity_sent: r.quantity_sent,
      quantity_returned: r.quantity_returned,
    });
    groups.set(key, group);
  }
  const groupList = Array.from(groups.values()).sort((a, b) => a.sortOrder - b.sortOrder);

  const tanggal = new Date(order.departure_date ?? order.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const orderInfo: OrderInfo = {
    code: order.code,
    companyName: order.companies?.name,
    destination: order.destination_address || order.companies?.address || "",
  };

  // Chunk groups into physical pages: two consecutive half_page groups
  // share one page, drawn at the top half and bottom half respectively;
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

  const doc = new PDFDocument({
    size: [PAGE_WIDTH_PT, PAGE_HEIGHT_PT],
    margins: { top: MARGIN_PT, bottom: MARGIN_PT, left: MARGIN_PT, right: MARGIN_PT },
    autoFirstPage: pages.length > 0,
  });
  // Default line width is 1pt; thin it to a hairline for the table grid.
  doc.lineWidth(0.5);

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const donePromise = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  if (pages.length === 0) {
    doc.addPage({ size: [PAGE_WIDTH_PT, PAGE_HEIGHT_PT], margin: MARGIN_PT });
    doc.font("Helvetica").fontSize(FONT_SIZE).text("Belum ada barang.", MARGIN_PT, MARGIN_PT);
  } else {
    pages.forEach((pageGroups, idx) => {
      if (idx > 0) {
        doc.addPage({ size: [PAGE_WIDTH_PT, PAGE_HEIGHT_PT], margin: MARGIN_PT });
        doc.lineWidth(0.5);
      }
      if (pageGroups.length === 2) {
        drawGroupBlock(doc, pageGroups[0], orderInfo, tanggal, MARGIN_PT);
        drawGroupBlock(doc, pageGroups[1], orderInfo, tanggal, HALF_PAGE_PT + MARGIN_PT);
      } else {
        drawGroupBlock(doc, pageGroups[0], orderInfo, tanggal, MARGIN_PT);
      }
    });
  }

  doc.end();
  const buffer = await donePromise;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.code ?? "surat-jalan"}.pdf"`,
    },
  });
}
