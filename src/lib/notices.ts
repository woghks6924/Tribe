import { prisma } from "@/lib/prisma";

export type PopupNotice = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  linkUrl: string | null;
};

export async function getActivePopupNotices(): Promise<PopupNotice[]> {
  const now = new Date();
  const notices = await prisma.notice.findMany({
    where: {
      active: true,
      popupEnabled: true,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
  });

  return notices.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    imageUrl: n.imageUrl,
    linkUrl: n.linkUrl,
  }));
}
