import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import type {
  RunningFormCategory,
  RunningFormCollabBrand,
  RunningFormField,
  RunningFormStatus,
} from "@/lib/running";

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
      entryFee: f.entryFee,
      capacity: f.capacity,
      applicationStartAt: f.applicationStartAt ? f.applicationStartAt.toISOString() : null,
      applicationEndAt: f.applicationEndAt ? f.applicationEndAt.toISOString() : null,
      status: f.status,
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
  entryFee?: number | null;
  capacity?: number | null;
  applicationStartAt?: string | null;
  applicationEndAt?: string | null;
  status?: RunningFormStatus;
  isPublished?: boolean;
  privacyItems?: string;
  privacyPurpose?: string;
  privacyRetention?: string;
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
      entryFee: body.entryFee ?? null,
      capacity: body.capacity ?? null,
      applicationStartAt: body.applicationStartAt ? new Date(body.applicationStartAt) : null,
      applicationEndAt: body.applicationEndAt ? new Date(body.applicationEndAt) : null,
      status: body.status ?? "UPCOMING",
      isPublished: body.isPublished ?? false,
      privacyItems: body.privacyItems || "이름, 연락처",
      privacyPurpose: body.privacyPurpose || "이벤트 진행 및 당첨 안내",
      privacyRetention: body.privacyRetention || "행사 종료 후 파기",
      collabBrands: body.collabBrands ?? [],
      fields: body.fields ?? [],
    },
  });

  return NextResponse.json({ id: form.id });
}
