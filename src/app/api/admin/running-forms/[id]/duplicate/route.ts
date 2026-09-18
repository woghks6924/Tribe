import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const source = await prisma.runningForm.findUnique({ where: { id } });
  if (!source) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  const copy = await prisma.runningForm.create({
    data: {
      title: `${source.title} (사본)`,
      thumbnailUrl: source.thumbnailUrl,
      eventDate: source.eventDate,
      category: source.category,
      noticeContent: source.noticeContent,
      providedItems: source.providedItems,
      entryFee: source.entryFee,
      bankName: source.bankName,
      bankAccountNumber: source.bankAccountNumber,
      bankAccountHolder: source.bankAccountHolder,
      capacity: source.capacity,
      status: "UPCOMING",
      isPublished: false,
      privacyItems: source.privacyItems,
      privacyPurpose: source.privacyPurpose,
      privacyRetention: source.privacyRetention,
      collabBrands: source.collabBrands ?? [],
      fields: source.fields ?? [],
    },
  });

  return NextResponse.json({ id: copy.id });
}
