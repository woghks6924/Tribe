import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createCustomerSession } from "@/lib/auth/session";
import { exchangeNaverCode, getNaverProfile, NAVER_STATE_COOKIE } from "@/lib/auth/naver";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const origin = url.origin;

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(NAVER_STATE_COOKIE)?.value;
  cookieStore.delete(NAVER_STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/login?error=naver_state`);
  }

  try {
    const redirectUri = `${origin}/api/auth/naver/callback`;
    const accessToken = await exchangeNaverCode(code, state, redirectUri);
    const profile = await getNaverProfile(accessToken);

    if (!profile.email) {
      return NextResponse.redirect(`${origin}/login?error=naver_no_email`);
    }

    let customer = await prisma.customer.findUnique({ where: { naverId: profile.id } });

    if (!customer) {
      // 같은 이메일로 가입된 계정이 있으면 네이버 계정을 연결한다.
      customer = await prisma.customer.findUnique({ where: { email: profile.email } });
      if (customer) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { naverId: profile.id },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            email: profile.email,
            name: profile.name ?? profile.nickname ?? "Tri.be Member",
            naverId: profile.id,
            emailVerified: new Date(),
          },
        });
      }
    }

    await createCustomerSession({ sub: customer.id, email: customer.email, name: customer.name });
    return NextResponse.redirect(`${origin}/account`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=naver_failed`);
  }
}
