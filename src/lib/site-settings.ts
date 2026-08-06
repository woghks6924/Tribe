import { prisma } from "@/lib/prisma";

export async function getShippingReturnsContent(): Promise<string> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  return settings?.shippingReturnsContent ?? "";
}
