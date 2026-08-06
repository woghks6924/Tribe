import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createAdminSession } from "@/lib/auth/admin-session";

// 관리자 계정이 하나도 없을 때만 동작하는 최초 부트스트랩 엔드포인트.
// 이후에는 항상 403을 반환해 추가 관리자 생성을 막는다.
export async function POST(request: Request) {
  const existingCount = await prisma.adminUser.count();
  if (existingCount > 0) {
    return NextResponse.json({ error: "Setup already completed." }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string; email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();
  const password = body.password;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.adminUser.create({ data: { email, name, passwordHash } });

  await createAdminSession({ sub: admin.id, email: admin.email, name: admin.name });

  return NextResponse.json({ id: admin.id, name: admin.name, email: admin.email });
}
