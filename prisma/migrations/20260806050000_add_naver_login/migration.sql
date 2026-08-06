-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "Customer" ADD COLUMN     "naverId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_naverId_key" ON "Customer"("naverId");
