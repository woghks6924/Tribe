-- DropTable
DROP TABLE "BannerVideo";

-- CreateEnum
CREATE TYPE "BannerMediaType" AS ENUM ('VIDEO', 'IMAGE');

-- CreateTable
CREATE TABLE "BannerSlide" (
    "id" TEXT NOT NULL,
    "mediaType" "BannerMediaType" NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "label" TEXT,
    "brightness" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BannerSlide_pkey" PRIMARY KEY ("id")
);
