-- CreateEnum
CREATE TYPE "RaceLogKind" AS ENUM ('RUN', 'WOD', 'SWIM', 'GYM');

-- CreateTable
CREATE TABLE "RaceSeason" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 50,
    "goalKm" DOUBLE PRECISION NOT NULL DEFAULT 425,
    "inviteCode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "runFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "wodMinutesPerKm" DOUBLE PRECISION NOT NULL DEFAULT 6,
    "swimMetersPerKm" DOUBLE PRECISION NOT NULL DEFAULT 250,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaceSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "eye" TEXT NOT NULL,
    "acc" TEXT NOT NULL,
    "igHandle" TEXT,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceLog" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "kind" "RaceLogKind" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "convertedKm" DOUBLE PRECISION NOT NULL,
    "proofPath" TEXT,
    "proofExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RaceSeason_inviteCode_key" ON "RaceSeason"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "RaceMember_name_key" ON "RaceMember"("name");

-- CreateIndex
CREATE INDEX "RaceLog_seasonId_idx" ON "RaceLog"("seasonId");

-- CreateIndex
CREATE INDEX "RaceLog_memberId_idx" ON "RaceLog"("memberId");

-- AddForeignKey
ALTER TABLE "RaceLog" ADD CONSTRAINT "RaceLog_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "RaceSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceLog" ADD CONSTRAINT "RaceLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "RaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
