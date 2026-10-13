-- 추가 전용: 컬럼만 더하고 기존 컬럼·기록은 건드리지 않는다.
ALTER TABLE "RaceMember" ADD COLUMN "hairStyle" TEXT;
ALTER TABLE "RaceMember" ADD COLUMN "topColor" TEXT NOT NULL DEFAULT '#2b2b30';
ALTER TABLE "RaceMember" ADD COLUMN "bottomColor" TEXT NOT NULL DEFAULT '#2c3e66';
ALTER TABLE "RaceMember" ADD COLUMN "shoesColor" TEXT NOT NULL DEFAULT '#f2f2ee';
ALTER TABLE "RaceMember" ADD COLUMN "hairColor" TEXT NOT NULL DEFAULT '#2a2430';
ALTER TABLE "RaceMember" ADD COLUMN "bibNumber" INTEGER;

-- 백필: 기존 대표색(color)을 상의색으로.
UPDATE "RaceMember" SET "topColor" = "color";
