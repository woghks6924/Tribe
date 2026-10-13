-- 추가 전용: 컬럼만 더한다(둘 다 NULL 허용, 기존 데이터·컬럼은 그대로).
ALTER TABLE "RaceMember" ADD COLUMN "petKey" TEXT;
ALTER TABLE "RaceMember" ADD COLUMN "equipV4" JSONB;
