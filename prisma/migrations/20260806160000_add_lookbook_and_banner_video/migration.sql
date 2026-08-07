-- CreateTable
CREATE TABLE "LookbookPhoto" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LookbookPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannerVideo" (
    "id" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "label" TEXT,
    "brightness" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BannerVideo_pkey" PRIMARY KEY ("id")
);
