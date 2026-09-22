"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

export async function createUnit(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama satuan wajib diisi." };

  const { error } = await supabase.from("units").insert({ name });
  if (error) return { error: error.message };

  revalidatePath("/master-data");
  return { error: null };
}

export async function deleteUnit(id: string) {
  const supabase = await createClient();
  await supabase.from("units").delete().eq("id", id);
  revalidatePath("/master-data");
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

export async function deleteCompany(id: string) {
  const supabase = await createClient();
  await supabase.from("companies").delete().eq("id", id);
  revalidatePath("/master-data");
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const businessModel = String(formData.get("business_model") ?? "");
  const unitId = String(formData.get("unit_id") ?? "");
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
    min_stock: minStock || 0,
    price_retail: priceRetailRaw ? Number(priceRetailRaw) : null,
    price_wholesale: priceWholesaleRaw ? Number(priceWholesaleRaw) : null,
  });
  if (error) return { error: error.message };

  revalidatePath("/master-data");
  revalidatePath("/stok");
  return { error: null };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/master-data");
  revalidatePath("/stok");
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
  const finishedProductId = String(formData.get("finished_product_id") ?? "");
  const itemsRaw = String(formData.get("items") ?? "[]");

  let items: { raw_material_id: string; quantity_per_unit: number }[] = [];
  try {
    items = JSON.parse(itemsRaw).filter(
      (it: { raw_material_id: string; quantity_per_unit: number }) =>
        it.raw_material_id && it.quantity_per_unit > 0
    );
  } catch {
    return { error: "Data bahan tidak valid." };
  }

  if (!name || !finishedProductId || items.length === 0) {
    return { error: "Nama resep, produk hasil, dan minimal satu bahan wajib diisi." };
  }

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({ name, finished_product_id: finishedProductId })
    .select("id")
    .single();

  if (error || !recipe) return { error: error?.message ?? "Gagal membuat resep." };

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

export async function deleteRecipe(id: string) {
  const supabase = await createClient();
  await supabase.from("recipes").delete().eq("id", id);
  revalidatePath("/master-data");
  revalidatePath("/produksi");
}
