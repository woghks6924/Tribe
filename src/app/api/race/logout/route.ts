import { NextResponse } from "next/server";
import { clearRaceSession } from "@/lib/auth/race-session";

export async function POST() {
  await clearRaceSession();
  return NextResponse.json({ ok: true });
}
