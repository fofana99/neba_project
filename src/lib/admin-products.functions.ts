import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rowToProduct } from "./products";

async function getAdmin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

async function assertAdmin() {
  const { requireAdmin } = await import("./admin-auth.server");
  await requireAdmin();
}

const colorSchema = z.object({
  name: z.string().min(1).max(60),
  hex: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
});

const productWriteBase = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug: lettres minuscules, chiffres et tirets"),
  name: z.string().min(1).max(200),
  category_slug: z.string().min(1).max(80),
  collection: z.string().max(120).default(""),
  price: z.number().int().min(0).max(50_000_000),
  original_price: z.number().int().min(0).max(50_000_000).nullable(),
  image: z.string().min(1).max(2000),
  images: z.array(z.string().min(1).max(2000)).max(20),
  colors: z.array(colorSchema).max(20),
  sizes: z.array(z.string().min(1).max(40)).max(30),
  materials: z.string().max(2000).default(""),
  description: z.string().max(4000).default(""),
  stock: z.number().int().min(0).max(1_000_000),
  is_new: z.boolean(),
  published: z.boolean(),
  sort_order: z.number().int().min(0).max(10_000).default(0),
});

const promoRefine = <T extends { price: number; original_price: number | null }>(
  d: T,
) => d.original_price == null || d.original_price > d.price;
const promoMsg = {
  message: "Le prix promo doit être strictement inférieur au prix original.",
  path: ["original_price"] as (string | number)[],
};

const productWriteSchema = productWriteBase.refine(promoRefine, promoMsg);
const productUpdateSchema = z
  .object({ id: z.string().uuid() })
  .merge(productWriteBase)
  .refine(promoRefine, promoMsg);




export const adminListProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    await assertAdmin();
    const supabase = await getAdmin();
    const { sweepExpiredStock } = await import("./stock-sweep.server");
    await sweepExpiredStock(supabase);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToProduct);
  },
);

export const adminGetProduct = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin();
    const supabase = await getAdmin();
    const { data: row, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? rowToProduct(row) : null;
  });

export const adminCreateProduct = createServerFn({ method: "POST" })
  .validator((data: unknown) => productWriteSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin();
    const supabase = await getAdmin();
    const { data: row, error } = await supabase
      .from("products")
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToProduct(row);
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .validator((data: unknown) => productUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin();
    const supabase = await getAdmin();
    const { id, ...payload } = data;
    const { data: row, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    return rowToProduct(row);
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdmin();
    const supabase = await getAdmin();
    const { error } = await supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminUpdateStock = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({ id: z.string().uuid(), stock: z.number().int().min(0).max(1_000_000) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdmin();
    const supabase = await getAdmin();
    const { error } = await supabase
      .from("products")
      .update({ stock: data.stock })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminTogglePublished = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), published: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdmin();
    const supabase = await getAdmin();
    const { error } = await supabase
      .from("products")
      .update({ published: data.published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
