import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getNaverAuthorizeUrl, NAVER_STATE_COOKIE } from "@/lib/auth/naver";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/naver/callback`;
  const state = randomUUID();

  let authorizeUrl: string;
  try {
    authorizeUrl = getNaverAuthorizeUrl(state, redirectUri);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=naver_not_configured`);
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(NAVER_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
