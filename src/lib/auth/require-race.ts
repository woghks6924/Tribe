import { NextResponse } from "next/server";
import { getCurrentRaceMember, type RaceSessionPayload } from "@/lib/auth/race-session";

export async function requireRaceMember(): Promise<
  { session: RaceSessionPayload; response: null } | { session: null; response: NextResponse }
> {
  const session = await getCurrentRaceMember();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 }) };
  }
  return { session, response: null };
}
