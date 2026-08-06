-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "infoContent" TEXT,
ADD COLUMN     "sizeContent" TEXT,
ADD COLUMN     "detailContent" TEXT;

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "shippingReturnsContent" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
