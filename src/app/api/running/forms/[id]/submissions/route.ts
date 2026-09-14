import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRunningFormClosed, type RunningFormField } from "@/lib/running";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    name: string;
    gender?: string;
    phone: string;
    email?: string;
    instagramId?: string;
    marketingConsent: boolean;
    privacyConsent: boolean;
    answers?: Record<string, string | string[]>;
  };

  if (!body.name?.trim() || !body.phone?.trim() || !body.privacyConsent) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const form = await prisma.runningForm.findUnique({
    where: { id },
    include: { _count: { select: { submissions: true } } },
  });

  if (!form || !form.isPublished) {
    return NextResponse.json({ error: "존재하지 않는 신청폼입니다." }, { status: 404 });
  }

  if (isRunningFormClosed(form, form._count.submissions)) {
    return NextResponse.json({ error: "마감된 신청폼입니다." }, { status: 400 });
  }

  const fields = Array.isArray(form.fields) ? (form.fields as RunningFormField[]) : [];
  const answers = body.answers ?? {};
  for (const field of fields) {
    if (!field.required) continue;
    const value = answers[field.id];
    const isEmpty =
      value == null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0);
    if (isEmpty) {
      return NextResponse.json({ error: `${field.label}을(를) 입력해주세요.` }, { status: 400 });
    }
  }

  await prisma.runningSubmission.create({
    data: {
      formId: id,
      name: body.name.trim(),
      gender: body.gender || null,
      phone: body.phone.trim(),
      email: body.email || null,
      instagramId: body.instagramId || null,
      marketingConsent: !!body.marketingConsent,
      privacyConsent: !!body.privacyConsent,
      answers,
    },
  });

  return NextResponse.json({ ok: true });
}
