import { prisma } from "@/lib/prisma";

export type LookbookPhotoData = {
  id: string;
  imageUrl: string;
  caption: string;
};

export async function getActiveLookbookPhotos(): Promise<LookbookPhotoData[]> {
  const photos = await prisma.lookbookPhoto.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return photos.map((p) => ({ id: p.id, imageUrl: p.imageUrl, caption: p.caption }));
}
