import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const phoneRe = /^[+0-9\s().-]{6,25}$/;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  phone: z.string().trim().regex(phoneRe, "Téléphone invalide").max(25),
  email: z
    .string()
    .trim()
    .max(160)
    .refine((v) => v === "" || emailRe.test(v), "Email invalide")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

const idSchema = z.object({ id: z.string().uuid() });

const SAFE_COLS = "id, first_name, last_name, phone, email";

async function admin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

async function assertAdmin() {
  const { requireAdmin } = await import("./admin-auth.server");
  await requireAdmin();
}

export const registerCustomer = createServerFn({ method: "POST" })
  .validator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = await admin();
    const { data: row, error } = await supabase
      .from("customers")
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        email: data.email,
      })
      .select(SAFE_COLS)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getCustomerById = createServerFn({ method: "GET" })
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = await admin();
    const { data: row, error } = await supabase
      .from("customers")
      .select(SAFE_COLS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? null;
  });

export const adminListCustomers = createServerFn({ method: "GET" }).handler(
  async () => {
    await assertAdmin();
    const supabase = await admin();
    const { data, error } = await supabase
      .from("customers")
      .select(`${SAFE_COLS}, created_at`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);
