CREATE TABLE "RaceGuestbookEntry" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceGuestbookEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RaceGuestbookEntry_seasonId_idx" ON "RaceGuestbookEntry"("seasonId");

ALTER TABLE "RaceGuestbookEntry" ADD CONSTRAINT "RaceGuestbookEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "RaceSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RaceGuestbookEntry" ADD CONSTRAINT "RaceGuestbookEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "RaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
