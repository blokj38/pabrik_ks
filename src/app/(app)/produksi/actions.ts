"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProductionState = { error: string | null; success?: boolean };

export async function runProductionAction(
  _prevState: ProductionState,
  formData: FormData
): Promise<ProductionState> {
  const supabase = await createClient();

  const recipeId = String(formData.get("recipe_id") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const note = String(formData.get("note") ?? "") || undefined;

  if (!recipeId || !quantity || quantity <= 0) {
    return { error: "Resep dan jumlah produksi wajib diisi." };
  }

  const { error } = await supabase.rpc("run_production", {
    p_recipe_id: recipeId,
    p_quantity_produced: quantity,
    p_note: note,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/produksi");
  revalidatePath("/stok");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function deleteProductionRun(productionRunId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_production_run", {
    p_production_run_id: productionRunId,
  });

  revalidatePath("/produksi");
  revalidatePath("/stok");
  revalidatePath("/");
  return { error: error?.message ?? null };
}
