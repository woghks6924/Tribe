ALTER TYPE "RunningSubmissionStatus" ADD VALUE 'DECLINED';
ALTER TABLE "RunningSubmission" ADD COLUMN "notified" BOOLEAN NOT NULL DEFAULT false;
