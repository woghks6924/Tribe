-- AlterTable
ALTER TABLE "RunningForm" ADD COLUMN     "closedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RunningSubmission" ADD COLUMN     "personalDataPurgedAt" TIMESTAMP(3);
