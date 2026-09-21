"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type StockMovementState = { error: string | null; success?: boolean };

export async function createStockMovement(
  _prevState: StockMovementState,
  formData: FormData
): Promise<StockMovementState> {
  const supabase = await createClient();

  const productId = String(formData.get("product_id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const note = String(formData.get("note") ?? "") || null;
  const batchNumber = String(formData.get("batch_number") ?? "") || null;
  const expiredDateRaw = String(formData.get("expired_date") ?? "");
  const expiredDate = expiredDateRaw ? expiredDateRaw : null;

  if (!productId || !quantity || quantity <= 0) {
    return { error: "Produk dan jumlah wajib diisi dengan nilai lebih dari 0." };
  }

  const movementType = direction === "masuk" ? "in" : "out";

  if (movementType === "out") {
    const { data: product } = await supabase
      .from("products")
      .select("current_stock, name")
      .eq("id", productId)
      .single();

    if (product && product.current_stock < quantity) {
      return {
        error: `Stok ${product.name} tidak cukup (tersedia ${product.current_stock}).`,
      };
    }
  }

  const { error } = await supabase.from("stock_movements").insert({
    product_id: productId,
    movement_type: movementType,
    quantity,
    note,
    batch_number: batchNumber,
    expired_date: expiredDate,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/stok");
  revalidatePath("/");
  return { error: null, success: true };
}
