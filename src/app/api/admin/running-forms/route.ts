import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { RunningFormCategory, RunningFormCollabBrand, RunningFormField } from "@/lib/running";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const forms = await prisma.runningForm.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  return NextResponse.json(
    forms.map((f) => ({
      id: f.id,
      title: f.title,
      thumbnailUrl: f.thumbnailUrl,
      eventDate: f.eventDate.toISOString(),
      category: f.category,
      capacity: f.capacity,
      isClosed: f.isClosed,
      isPublished: f.isPublished,
      submissionCount: f._count.submissions,
      createdAt: f.createdAt.toISOString(),
    })),
  );
}

export type RunningFormInput = {
  title: string;
  thumbnailUrl?: string | null;
  eventDate: string;
  category: RunningFormCategory;
  noticeContent?: string | null;
  providedItems?: string | null;
  capacity?: number | null;
  isClosed?: boolean;
  isPublished?: boolean;
  collabBrands?: RunningFormCollabBrand[];
  fields: RunningFormField[];
};

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as RunningFormInput;

  if (!body.title || !body.eventDate) {
    return NextResponse.json({ error: "Please provide a title and event date." }, { status: 400 });
  }

  const form = await prisma.runningForm.create({
    data: {
      title: body.title,
      thumbnailUrl: body.thumbnailUrl || null,
      eventDate: new Date(body.eventDate),
      category: body.category ?? "FIRST_COME",
      noticeContent: body.noticeContent || null,
      providedItems: body.providedItems || null,
      capacity: body.capacity ?? null,
      isClosed: body.isClosed ?? false,
      isPublished: body.isPublished ?? false,
      collabBrands: body.collabBrands ?? [],
      fields: body.fields ?? [],
    },
  });

  return NextResponse.json({ id: form.id });
}
