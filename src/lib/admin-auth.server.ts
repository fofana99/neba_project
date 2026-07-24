import { useSession } from "@tanstack/react-start/server";

export const adminSessionConfig = {
  password:
    process.env.SESSION_SECRET ??
    "insecure-fallback-change-me-please-32chars-please-change",
  name: "neba-admin",
  maxAge: 60 * 60 * 8,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
};

type AdminSession = { unlocked?: boolean };

export async function requireAdmin() {
  const session = await useSession<AdminSession>(adminSessionConfig);
  if (!session.data.unlocked) {
    throw new Error("Unauthorized: administration locked");
  }
}

export async function readAdminSession() {
  return useSession<AdminSession>(adminSessionConfig);
}
