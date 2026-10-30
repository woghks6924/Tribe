import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { validatePhotoEvent, type PhotoEventInput } from "@/lib/race-photo-event-validate";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  return NextResponse.json(await prisma.racePhotoEvent.findMany({ orderBy: { date: "desc" } }));
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = validatePhotoEvent((await request.json()) as Record<string, unknown>);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value as PhotoEventInput;

  if (await prisma.racePhotoEvent.findUnique({ where: { slug: v.slug } })) {
    return NextResponse.json({ error: `'${v.slug}'은(는) 이미 등록된 slug예요.` }, { status: 400 });
  }
  const created = await prisma.racePhotoEvent.create({ data: { ...v, published: v.published ?? true } });
  // /photos는 정적으로 만들어져 있어서, 저장하면 바로 새로 만들도록 캐시를 비운다.
  revalidatePath("/photos", "layout");
  return NextResponse.json(created);
}
