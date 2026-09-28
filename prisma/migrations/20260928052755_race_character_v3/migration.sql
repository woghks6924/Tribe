ALTER TABLE "RaceLog" ADD COLUMN "durationSec" INTEGER;

ALTER TABLE "RaceMember" ADD COLUMN "eqHead" TEXT;
ALTER TABLE "RaceMember" ADD COLUMN "eqFace" TEXT;
ALTER TABLE "RaceMember" ADD COLUMN "eqNeck" TEXT;
ALTER TABLE "RaceMember" ADD COLUMN "eqBody" TEXT;
ALTER TABLE "RaceMember" ADD COLUMN "eqWrist" TEXT;
ALTER TABLE "RaceMember" ADD COLUMN "eqFeet" TEXT;

CREATE TABLE "RaceMemberItem" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "acquiredLevel" INTEGER,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceMemberItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RaceMemberItem_memberId_itemId_key" ON "RaceMemberItem"("memberId", "itemId");
CREATE INDEX "RaceMemberItem_memberId_idx" ON "RaceMemberItem"("memberId");

ALTER TABLE "RaceMemberItem" ADD CONSTRAINT "RaceMemberItem_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "RaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RaceConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "levelBaseKm" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "levelExponent" DOUBLE PRECISION NOT NULL DEFAULT 1.6,
    "maxLevel" INTEGER NOT NULL DEFAULT 30,
    "pickLevels" JSONB NOT NULL DEFAULT '[3,5,8,10,13,15,20,25]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaceConfig_pkey" PRIMARY KEY ("id")
);
