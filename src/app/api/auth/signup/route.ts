import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createCustomerSession } from "@/lib/auth/session";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();
  const password = body.password;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const customer = await prisma.customer.create({
    data: { email, name, passwordHash, phone: body.phone?.trim() || undefined },
  });

  const token = randomUUID();
  await prisma.verificationToken.create({
    data: {
      email,
      token,
      type: "EMAIL_VERIFY",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  await sendVerificationEmail(email, token, new URL(request.url).origin);

  await createCustomerSession({ sub: customer.id, email: customer.email, name: customer.name });

  return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email });
}
