import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveRunningFormStatus, type RunningFormField } from "@/lib/running";

function normalizePhone(v: string): string {
  return v.replace(/\D/g, "");
}

function normalizeInstagram(v: string): string {
  return v.trim().replace(/^@/, "").toLowerCase();
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    name: string;
    gender?: string;
    phone: string;
    email?: string;
    instagramId?: string;
    previousParticipant?: boolean;
    marketingConsent: boolean;
    privacyConsent: boolean;
    answers?: Record<string, string | string[]>;
  };

  if (!body.name?.trim() || !body.phone?.trim() || !body.instagramId?.trim() || !body.privacyConsent) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const form = await prisma.runningForm.findUnique({
    where: { id },
    include: { _count: { select: { submissions: true } } },
  });

  if (!form || !form.isPublished) {
    return NextResponse.json({ error: "존재하지 않는 신청폼입니다." }, { status: 404 });
  }

  if (getEffectiveRunningFormStatus(form, form._count.submissions) !== "OPEN") {
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

  // 같은 폼에 전화번호 또는 인스타그램 계정이 겹치면 중복 신청으로 막는다.
  const normPhone = normalizePhone(body.phone);
  const normInsta = normalizeInstagram(body.instagramId);
  const existing = await prisma.runningSubmission.findMany({
    where: { formId: id },
    select: { phone: true, instagramId: true },
  });
  const isDuplicate = existing.some(
    (s) =>
      normalizePhone(s.phone) === normPhone ||
      (s.instagramId && normalizeInstagram(s.instagramId) === normInsta),
  );
  if (isDuplicate) {
    return NextResponse.json(
      { error: "이미 신청하셨습니다. 동일한 연락처 또는 인스타그램 계정으로는 중복 신청할 수 없습니다." },
      { status: 400 },
    );
  }

  await prisma.runningSubmission.create({
    data: {
      formId: id,
      name: body.name.trim(),
      gender: body.gender || null,
      phone: body.phone.trim(),
      email: body.email || null,
      instagramId: body.instagramId.trim(),
      previousParticipant: !!body.previousParticipant,
      marketingConsent: !!body.marketingConsent,
      privacyConsent: !!body.privacyConsent,
      answers,
    },
  });

  // 이번 신청으로 정원이 다 찼으면(선착순 등) status를 실제로 CLOSED로 바꾸고
  // closedAt을 찍는다 — 그래야 개인정보 30일 자동 파기 타이머가 시작된다.
  // (정원 체크만으로는 "표시상"으로만 마감일 뿐 status 필드는 그대로 남기 때문.)
  if (form.status === "OPEN" && form.capacity != null && form._count.submissions + 1 >= form.capacity) {
    await prisma.runningForm.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
