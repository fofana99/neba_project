import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uploadSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  // base64 (no data: prefix)
  dataBase64: z.string().min(1),
});

// 10 years, long enough for a permanent product asset
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10;
const BUCKET = "product-images";

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]+/g, "") : "jpg";
  return `${base}.${ext || "jpg"}`;
}

export const adminUploadImage = createServerFn({ method: "POST" })
  .validator((data: unknown) => uploadSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-auth.server");
    await requireAdmin();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.byteLength > 8 * 1024 * 1024) {
      throw new Error("Image trop lourde (max 8 Mo).");
    }

    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(data.filename)}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(key, bytes, {
        contentType: data.contentType,
        upsert: false,
      });
    if (upErr) throw new Error(upErr.message);

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(key, SIGNED_URL_TTL_SECONDS);
    if (signErr || !signed) throw new Error(signErr?.message ?? "URL introuvable");

    return { url: signed.signedUrl, path: key };
  });
