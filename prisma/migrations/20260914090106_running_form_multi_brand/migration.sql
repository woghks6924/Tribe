/*
  Warnings:

  - You are about to drop the column `collabBrandName` on the `RunningForm` table. All the data in the column will be lost.
  - You are about to drop the column `collabBrandUrl` on the `RunningForm` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RunningForm" DROP COLUMN "collabBrandName",
DROP COLUMN "collabBrandUrl",
ADD COLUMN     "collabBrands" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "providedItems" TEXT;
