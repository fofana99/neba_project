import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";

function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const checkAdminUnlocked = createServerFn({ method: "GET" }).handler(
  async () => {
    const { readAdminSession } = await import("./admin-auth.server");
    const session = await readAdminSession();
    return { unlocked: Boolean(session.data.unlocked) };
  },
);

export const unlockAdmin = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return { ok: false as const, reason: "not_configured" as const };
    }
    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const, reason: "invalid" as const };
    }
    const { readAdminSession } = await import("./admin-auth.server");
    const session = await readAdminSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { readAdminSession } = await import("./admin-auth.server");
  const session = await readAdminSession();
  await session.clear();
  return { ok: true as const };
});
