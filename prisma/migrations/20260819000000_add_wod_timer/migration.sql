-- CreateTable
CREATE TABLE "WodSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WodSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WodRound" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "roundName" TEXT,
    "runDistance" TEXT,
    "exercises" JSONB NOT NULL DEFAULT '[]',
    "timeCapSec" INTEGER,
    "restTimeSec" INTEGER,
    "bonusExercise" TEXT,

    CONSTRAINT "WodRound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WodRound_sessionId_idx" ON "WodRound"("sessionId");

-- AddForeignKey
ALTER TABLE "WodRound" ADD CONSTRAINT "WodRound_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WodSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
