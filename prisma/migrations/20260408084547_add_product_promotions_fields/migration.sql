-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discount" INTEGER,
ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT false;
