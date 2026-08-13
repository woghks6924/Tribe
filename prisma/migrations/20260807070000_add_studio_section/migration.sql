-- CreateEnum
CREATE TYPE "StudioTheme" AS ENUM ('LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "StudioInquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- AlterTable
ALTER TABLE "SiteSettings"
  ADD COLUMN     "showStudioTab" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "studioTheme" "StudioTheme" NOT NULL DEFAULT 'LIGHT',
  ADD COLUMN     "studioHeroHeadline" TEXT NOT NULL DEFAULT 'We shoot the sessions that make people want to run.';

-- CreateTable
CREATE TABLE "StudioPortfolioItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "videoUrl" TEXT,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioPortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioInquiry" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "packageInterest" TEXT,
    "message" TEXT NOT NULL,
    "status" "StudioInquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioInquiry_pkey" PRIMARY KEY ("id")
);
