CREATE TABLE "RaceInfluence" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceInfluence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RaceInfluence_logId_key" ON "RaceInfluence"("logId");
CREATE INDEX "RaceInfluence_seasonId_idx" ON "RaceInfluence"("seasonId");
CREATE INDEX "RaceInfluence_targetId_idx" ON "RaceInfluence"("targetId");
CREATE INDEX "RaceInfluence_actorId_idx" ON "RaceInfluence"("actorId");

ALTER TABLE "RaceInfluence" ADD CONSTRAINT "RaceInfluence_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "RaceSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RaceInfluence" ADD CONSTRAINT "RaceInfluence_logId_fkey" FOREIGN KEY ("logId") REFERENCES "RaceLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RaceInfluence" ADD CONSTRAINT "RaceInfluence_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "RaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RaceInfluence" ADD CONSTRAINT "RaceInfluence_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "RaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RaceConfig" ADD COLUMN "attackRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.05;
ALTER TABLE "RaceConfig" ADD COLUMN "cheerRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.15;
ALTER TABLE "RaceConfig" ADD COLUMN "nearbyRankRange" INTEGER NOT NULL DEFAULT 3;
