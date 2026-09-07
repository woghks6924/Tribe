-- AlterTable
ALTER TABLE "WodRound"
  DROP COLUMN "runDistance",
  DROP COLUMN "exercises",
  ADD COLUMN "segments" JSONB NOT NULL DEFAULT '[]';
