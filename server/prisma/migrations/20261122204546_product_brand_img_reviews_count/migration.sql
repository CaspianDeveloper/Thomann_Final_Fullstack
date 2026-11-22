-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brandImg" TEXT,
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "currency" SET DEFAULT 'USD';
