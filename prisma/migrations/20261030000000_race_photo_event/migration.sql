-- 추가 전용: 새 테이블만 만든다(기존 테이블·데이터는 건드리지 않는다).
CREATE TABLE "RacePhotoEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "driveFolderUrl" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RacePhotoEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RacePhotoEvent_slug_key" ON "RacePhotoEvent"("slug");
