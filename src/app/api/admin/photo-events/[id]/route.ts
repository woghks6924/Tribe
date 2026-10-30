import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { validatePhotoEvent } from "@/lib/race-photo-event-validate";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const parsed = validatePhotoEvent((await request.json()) as Record<string, unknown>, { partial: true });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const existing = await prisma.racePhotoEvent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "대회를 찾을 수 없어요." }, { status: 404 });
  if (parsed.value.slug && parsed.value.slug !== existing.slug) {
    if (await prisma.racePhotoEvent.findUnique({ where: { slug: parsed.value.slug } })) {
      return NextResponse.json({ error: `'${parsed.value.slug}'은(는) 이미 등록된 slug예요.` }, { status: 400 });
    }
  }
  const updated = await prisma.racePhotoEvent.update({ where: { id }, data: parsed.value });
  revalidatePath("/photos", "layout");
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  await prisma.racePhotoEvent.delete({ where: { id } }).catch(() => null);
  revalidatePath("/photos", "layout");
  return NextResponse.json({ ok: true });
}
