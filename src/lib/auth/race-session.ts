import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-me",
);

export const RACE_SESSION_COOKIE = "race_session";

export type RaceSessionPayload = {
  sub: string; // RaceMember id
  name: string;
};

async function signSession(payload: RaceSessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secret);
}

async function verifySession(token: string): Promise<RaceSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as RaceSessionPayload;
  } catch {
    return null;
  }
}

export async function createRaceSession(payload: RaceSessionPayload) {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(RACE_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function clearRaceSession() {
  const cookieStore = await cookies();
  cookieStore.delete(RACE_SESSION_COOKIE);
}

export async function getCurrentRaceMember(): Promise<RaceSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(RACE_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
