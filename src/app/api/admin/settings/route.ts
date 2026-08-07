import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return NextResponse.json(settings);
}

type SettingsBody = {
  shippingReturnsContent?: string;
  heroBadgeText?: string;
  heroHeadline?: string;
  heroSubtext?: string;
  storyLabel?: string;
  storyHeadline?: string;
  storyBody?: string;
  crewLabel?: string;
  crewHeadline?: string;
  crewBody?: string;
  crewCta?: string;
  newsletterHeadline?: string;
  newsletterBody?: string;
};

export async function PATCH(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as SettingsBody;

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: body,
    create: { id: "singleton", ...body },
  });

  return NextResponse.json(settings);
}
