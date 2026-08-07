-- AlterTable
ALTER TABLE "Product"
  ADD COLUMN     "fitType" TEXT,
  ADD COLUMN     "pocketing" TEXT,
  ADD COLUMN     "tempMin" INTEGER,
  ADD COLUMN     "tempMax" INTEGER,
  ADD COLUMN     "effortMin" INTEGER,
  ADD COLUMN     "effortMax" INTEGER,
  ADD COLUMN     "materials" TEXT,
  ADD COLUMN     "careInstructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN     "careNote" TEXT,
  ADD COLUMN     "madeIn" TEXT,
  ADD COLUMN     "purposeTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Functionality" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Functionality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFunctionality" (
    "productId" TEXT NOT NULL,
    "functionalityId" TEXT NOT NULL,

    CONSTRAINT "ProductFunctionality_pkey" PRIMARY KEY ("productId","functionalityId")
);

-- AddForeignKey
ALTER TABLE "ProductFunctionality" ADD CONSTRAINT "ProductFunctionality_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFunctionality" ADD CONSTRAINT "ProductFunctionality_functionalityId_fkey" FOREIGN KEY ("functionalityId") REFERENCES "Functionality"("id") ON DELETE CASCADE ON UPDATE CASCADE;
