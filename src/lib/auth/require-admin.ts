import { NextResponse } from "next/server";
import { getCurrentAdmin, type AdminSessionPayload } from "@/lib/auth/admin-session";

export async function requireAdmin(): Promise<
  { session: AdminSessionPayload; response: null } | { session: null; response: NextResponse }
> {
  const session = await getCurrentAdmin();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}
