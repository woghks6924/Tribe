-- CreateEnum
CREATE TYPE "RunningFormCategory" AS ENUM ('RANDOM_DRAW', 'FIRST_COME');

-- CreateEnum
CREATE TYPE "RunningSubmissionStatus" AS ENUM ('PENDING', 'WINNER', 'NOT_WINNER', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "RunningForm" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "category" "RunningFormCategory" NOT NULL DEFAULT 'FIRST_COME',
    "noticeContent" TEXT,
    "capacity" INTEGER,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "collabBrandName" TEXT,
    "collabBrandUrl" TEXT,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunningForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunningSubmission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "instagramId" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "status" "RunningSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunningSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RunningSubmission_formId_idx" ON "RunningSubmission"("formId");

-- AddForeignKey
ALTER TABLE "RunningSubmission" ADD CONSTRAINT "RunningSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "RunningForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
