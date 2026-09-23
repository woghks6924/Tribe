-- 기존 절차적 스프라이트 커스터마이징(color/eye/acc)을 레이어드 픽셀아트 에셋 기반
-- 커스터마이징으로 교체한다. 기존 값(현재 1명, "환비")은 새 시스템의 기본값으로
-- 리셋되고, 새 꾸미기 화면에서 다시 설정할 수 있다.
ALTER TABLE "RaceMember" ADD COLUMN "gender" TEXT NOT NULL DEFAULT 'male';
ALTER TABLE "RaceMember" ADD COLUMN "skinTone" TEXT NOT NULL DEFAULT 'light';
ALTER TABLE "RaceMember" ADD COLUMN "hairStyle" TEXT NOT NULL DEFAULT 'male-short';
ALTER TABLE "RaceMember" ADD COLUMN "hairColor" TEXT NOT NULL DEFAULT '#4a2f23';
ALTER TABLE "RaceMember" ADD COLUMN "topType" TEXT NOT NULL DEFAULT 'short-sleeve';
ALTER TABLE "RaceMember" ADD COLUMN "topColor" TEXT NOT NULL DEFAULT '#6aa7f0';
ALTER TABLE "RaceMember" ADD COLUMN "bottomType" TEXT NOT NULL DEFAULT 'shorts';
ALTER TABLE "RaceMember" ADD COLUMN "bottomColor" TEXT NOT NULL DEFAULT '#2f3136';
ALTER TABLE "RaceMember" ADD COLUMN "shoeType" TEXT NOT NULL DEFAULT 'sneakers';
ALTER TABLE "RaceMember" ADD COLUMN "prop" TEXT;

ALTER TABLE "RaceMember" DROP COLUMN "color";
ALTER TABLE "RaceMember" DROP COLUMN "eye";
ALTER TABLE "RaceMember" DROP COLUMN "acc";
