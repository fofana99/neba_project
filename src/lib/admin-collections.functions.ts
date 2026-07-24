import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
};

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

function rowToCollection(r: Row): Collection {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    sortOrder: r.sort_order,
  };
}

function slugify(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `collection-${Date.now()}`
  );
}

async function getAdmin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

async function assertAdmin() {
  const { requireAdmin } = await import("./admin-auth.server");
  await requireAdmin();
}

export const listPublicCollections = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToCollection);
  },
);

export const adminListCollections = createServerFn({ method: "GET" }).handler(
  async () => {
    await assertAdmin();
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToCollection);
  },
);

const writeSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).default(""),
  sort_order: z.number().int().min(0).max(10_000).default(0),
});

export const adminCreateCollection = createServerFn({ method: "POST" })
  .validator((data: unknown) => writeSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin();
    const supabase = await getAdmin();
    const slug = slugify(data.name);
    const { data: row, error } = await supabase
      .from("collections")
      .insert({ ...data, slug })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToCollection(row);
  });

export const adminUpdateCollection = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid() }).merge(writeSchema).parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdmin();
    const supabase = await getAdmin();
    const { id, ...payload } = data;
    const { data: row, error } = await supabase
      .from("collections")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToCollection(row);
  });

export const adminDeleteCollection = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdmin();
    const supabase = await getAdmin();
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
