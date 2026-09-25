"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };
export type DeleteState = { error: string | null };

function friendlyDeleteError(error: { code?: string; message: string } | null, whatUsesIt: string) {
  if (!error) return null;
  if (error.code === "23503") {
    return `Tidak bisa dihapus karena masih dipakai di ${whatUsesIt}.`;
  }
  return error.message;
}

export async function createUnit(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama satuan wajib diisi." };

  const { error } = await supabase.from("units").insert({ name });
  if (error) return { error: error.message };

  revalidatePath("/master-data");
  return { error: null };
}

export async function deleteUnit(id: string): Promise<DeleteState> {
  const supabase = await createClient();
  const { error } = await supabase.from("units").delete().eq("id", id);
  revalidatePath("/master-data");
  return { error: friendlyDeleteError(error, "data produk") };
}

export async function createCompany(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "customer");
  const address = String(formData.get("address") ?? "") || null;
  const phone = String(formData.get("phone") ?? "") || null;

  if (!name) return { error: "Nama perusahaan wajib diisi." };

  const { error } = await supabase.from("companies").insert({
    name,
    code,
    type: type as "supplier" | "customer" | "both",
    address,
    phone,
  });
  if (error) return { error: error.message };

  revalidatePath("/master-data");
  revalidatePath("/surat-jalan/baru");
  return { error: null };
}

export async function deleteCompany(id: string): Promise<DeleteState> {
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  revalidatePath("/master-data");
  return { error: friendlyDeleteError(error, "riwayat surat jalan") };
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const businessModel = String(formData.get("business_model") ?? "");
  const unitId = String(formData.get("unit_id") ?? "");
  const businessUnitId = String(formData.get("business_unit_id") ?? "") || null;
  const minStock = Number(formData.get("min_stock") ?? 0);
  const priceRetailRaw = String(formData.get("price_retail") ?? "");
  const priceWholesaleRaw = String(formData.get("price_wholesale") ?? "");

  if (!name || !category || !businessModel || !unitId) {
    return { error: "Nama, kategori, model bisnis, dan satuan wajib diisi." };
  }

  const { error } = await supabase.from("products").insert({
    name,
    category: category as "bahan_baku" | "barang_jadi",
    business_model: businessModel as "manufaktur" | "trading",
    unit_id: unitId,
    business_unit_id: businessUnitId,
    min_stock: minStock || 0,
    price_retail: priceRetailRaw ? Number(priceRetailRaw) : null,
    price_wholesale: priceWholesaleRaw ? Number(priceWholesaleRaw) : null,
  });
  if (error) return { error: error.message };

  revalidatePath("/master-data");
  revalidatePath("/stok");
  return { error: null };
}

export async function deleteProduct(id: string): Promise<DeleteState> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  revalidatePath("/master-data");
  revalidatePath("/stok");
  return {
    error: friendlyDeleteError(error, "riwayat stok/produksi/surat jalan"),
  };
}

export type ProductFormState = { error: string | null; success?: boolean };

export async function updateProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const businessModel = String(formData.get("business_model") ?? "");
  const unitId = String(formData.get("unit_id") ?? "");
  const businessUnitId = String(formData.get("business_unit_id") ?? "") || null;
  const minStock = Number(formData.get("min_stock") ?? 0);
  const priceRetailRaw = String(formData.get("price_retail") ?? "");
  const priceWholesaleRaw = String(formData.get("price_wholesale") ?? "");

  if (!id || !name || !category || !businessModel || !unitId) {
    return { error: "Nama, kategori, model bisnis, dan satuan wajib diisi." };
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      category: category as "bahan_baku" | "barang_jadi",
      business_model: businessModel as "manufaktur" | "trading",
      unit_id: unitId,
      business_unit_id: businessUnitId,
      min_stock: minStock || 0,
      price_retail: priceRetailRaw ? Number(priceRetailRaw) : null,
      price_wholesale: priceWholesaleRaw ? Number(priceWholesaleRaw) : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/master-data");
  revalidatePath("/stok");
  return { error: null, success: true };
}

export async function createRecipe(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const itemsRaw = String(formData.get("items") ?? "[]");
  const outputsRaw = String(formData.get("outputs") ?? "[]");

  let items: { raw_material_id: string; quantity_per_unit: number }[] = [];
  let outputs: { product_id: string; quantity_per_batch: number }[] = [];
  try {
    items = JSON.parse(itemsRaw).filter(
      (it: { raw_material_id: string; quantity_per_unit: number }) =>
        it.raw_material_id && it.quantity_per_unit > 0
    );
    outputs = JSON.parse(outputsRaw).filter(
      (o: { product_id: string; quantity_per_batch: number }) =>
        o.product_id && o.quantity_per_batch > 0
    );
  } catch {
    return { error: "Data resep tidak valid." };
  }

  if (!name || outputs.length === 0 || items.length === 0) {
    return {
      error: "Nama resep, minimal satu barang jadi hasil, dan minimal satu bahan wajib diisi.",
    };
  }

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({ name })
    .select("id")
    .single();

  if (error || !recipe) return { error: error?.message ?? "Gagal membuat resep." };

  const { error: outputsError } = await supabase.from("recipe_outputs").insert(
    outputs.map((o) => ({
      recipe_id: recipe.id,
      product_id: o.product_id,
      quantity_per_batch: o.quantity_per_batch,
    }))
  );
  if (outputsError) return { error: outputsError.message };

  const { error: itemsError } = await supabase.from("recipe_items").insert(
    items.map((it) => ({
      recipe_id: recipe.id,
      raw_material_id: it.raw_material_id,
      quantity_per_unit: it.quantity_per_unit,
    }))
  );
  if (itemsError) return { error: itemsError.message };

  revalidatePath("/master-data");
  revalidatePath("/produksi");
  return { error: null };
}

export async function deleteRecipe(id: string): Promise<DeleteState> {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  revalidatePath("/master-data");
  revalidatePath("/produksi");
  return { error: friendlyDeleteError(error, "riwayat produksi") };
}

export async function createBusinessUnit(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "") || null;
  if (!name) return { error: "Nama unit usaha wajib diisi." };

  const { error } = await supabase.from("business_units").insert({ name, address });
  if (error) return { error: error.message };

  revalidatePath("/master-data");
  return { error: null };
}

export async function deleteBusinessUnit(id: string): Promise<DeleteState> {
  const supabase = await createClient();
  const { error } = await supabase.from("business_units").delete().eq("id", id);
  revalidatePath("/master-data");
  return { error: friendlyDeleteError(error, "data produk") };
}
