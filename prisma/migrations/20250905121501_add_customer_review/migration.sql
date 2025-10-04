/*
  Warnings:

  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_revieweeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_reviewerId_fkey";

-- DropIndex
DROP INDEX "public"."Service_categoryId_idx";

-- DropIndex
DROP INDEX "public"."Service_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Service_isActive_idx";

-- DropIndex
DROP INDEX "public"."Service_price_idx";

-- DropIndex
DROP INDEX "public"."Service_providerId_idx";

-- DropTable
DROP TABLE "public"."Review";

-- CreateTable
CREATE TABLE "public"."CustomerReview" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."CustomerReview" ADD CONSTRAINT "CustomerReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerReview" ADD CONSTRAINT "CustomerReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
