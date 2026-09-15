-- AlterTable
ALTER TABLE "RunningForm" ADD COLUMN     "privacyItems" TEXT NOT NULL DEFAULT '이름, 연락처',
ADD COLUMN     "privacyPurpose" TEXT NOT NULL DEFAULT '이벤트 진행 및 당첨 안내',
ADD COLUMN     "privacyRetention" TEXT NOT NULL DEFAULT '행사 종료 후 파기';
