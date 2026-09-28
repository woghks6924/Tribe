CREATE TABLE "RacePoke" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "pokerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "RacePoke_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RacePoke_seasonId_idx" ON "RacePoke"("seasonId");
CREATE INDEX "RacePoke_targetId_idx" ON "RacePoke"("targetId");
CREATE INDEX "RacePoke_pokerId_idx" ON "RacePoke"("pokerId");

ALTER TABLE "RacePoke" ADD CONSTRAINT "RacePoke_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "RaceSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RacePoke" ADD CONSTRAINT "RacePoke_pokerId_fkey" FOREIGN KEY ("pokerId") REFERENCES "RaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RacePoke" ADD CONSTRAINT "RacePoke_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "RaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RaceReaction" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetMemberId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RaceReaction_targetType_targetId_memberId_key" ON "RaceReaction"("targetType", "targetId", "memberId");
CREATE INDEX "RaceReaction_targetType_targetId_idx" ON "RaceReaction"("targetType", "targetId");
CREATE INDEX "RaceReaction_targetMemberId_idx" ON "RaceReaction"("targetMemberId");

ALTER TABLE "RaceReaction" ADD CONSTRAINT "RaceReaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "RaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
