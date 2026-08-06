import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createCustomerSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { email } });
  const valid = customer ? await verifyPassword(password, customer.passwordHash) : false;

  if (!customer || !valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createCustomerSession({ sub: customer.id, email: customer.email, name: customer.name });

  return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email });
}
