import { createServerFn } from "@tanstack/react-start";
import { rowToProduct } from "./products";

async function getAdmin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

export const listPublicProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = await getAdmin();
    const { sweepExpiredStock } = await import("./stock-sweep.server");
    await sweepExpiredStock(supabase);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToProduct);
  },
);

export const getPublicProductBySlug = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const supabase = await getAdmin();
    const { sweepExpiredStock } = await import("./stock-sweep.server");
    await sweepExpiredStock(supabase);
    const { data: row, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? rowToProduct(row) : null;
  });
