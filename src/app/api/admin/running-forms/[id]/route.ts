import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { toRunningFormData } from "@/lib/running";
import type { RunningFormInput } from "../route";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const form = await prisma.runningForm.findUnique({ where: { id } });
  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  return NextResponse.json(toRunningFormData(form));
}

// CLOSED로 막 바뀌는 순간 closedAt을 찍고, CLOSED에서 벗어나면 다시 비운다 —
// 개인정보 자동 파기 크론이 이 시각 기준 30일을 계산한다.
function closedAtPatch(
  currentStatus: string,
  newStatus: string | undefined,
): { closedAt?: Date | null } {
  if (newStatus === undefined || newStatus === currentStatus) return {};
  if (newStatus === "CLOSED") return { closedAt: new Date() };
  if (currentStatus === "CLOSED") return { closedAt: null };
  return {};
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = (await request.json()) as RunningFormInput;

  if (!body.title || !body.eventDate) {
    return NextResponse.json({ error: "Please provide a title and event date." }, { status: 400 });
  }

  const existing = await prisma.runningForm.findUnique({ where: { id }, select: { status: true } });
  if (!existing) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }
  const nextStatus = body.status ?? "UPCOMING";

  await prisma.runningForm.update({
    where: { id },
    data: {
      title: body.title,
      thumbnailUrl: body.thumbnailUrl || null,
      eventDate: new Date(body.eventDate),
      category: body.category,
      noticeContent: body.noticeContent || null,
      providedItems: body.providedItems || null,
      capacity: body.capacity ?? null,
      status: nextStatus,
      ...closedAtPatch(existing.status, nextStatus),
      isPublished: body.isPublished ?? false,
      privacyItems: body.privacyItems || "이름, 연락처",
      privacyPurpose: body.privacyPurpose || "이벤트 진행 및 당첨 안내",
      privacyRetention: body.privacyRetention || "행사 종료 후 파기",
      collabBrands: body.collabBrands ?? [],
      fields: body.fields ?? [],
    },
  });

  return NextResponse.json({ ok: true });
}

// 목록 화면의 공개 여부/진행 상태 토글용 — 다른 필드는 건드리지 않고 부분 수정한다.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = (await request.json()) as {
    isPublished?: boolean;
    status?: "UPCOMING" | "OPEN" | "CLOSED";
  };

  const existing = await prisma.runningForm.findUnique({ where: { id }, select: { status: true } });
  if (!existing) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  await prisma.runningForm.update({
    where: { id },
    data: {
      ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...closedAtPatch(existing.status, body.status),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  await prisma.runningForm.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
