/*
  Warnings:

  - You are about to drop the column `isClosed` on the `RunningForm` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RunningFormStatus" AS ENUM ('UPCOMING', 'OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "RunningForm" DROP COLUMN "isClosed",
ADD COLUMN     "status" "RunningFormStatus" NOT NULL DEFAULT 'UPCOMING';
