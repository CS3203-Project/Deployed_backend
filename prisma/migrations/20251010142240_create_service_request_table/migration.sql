/*
  Warnings:

  - You are about to alter the column `combinedEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector` to `Unsupported("vector(768)")`.
  - You are about to alter the column `descriptionEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector` to `Unsupported("vector(768)")`.
  - You are about to alter the column `tagsEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector` to `Unsupported("vector(768)")`.
  - You are about to alter the column `titleEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector` to `Unsupported("vector(768)")`.

*/
-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING', 'MATCHED', 'COMPLETED', 'CLOSED');

-- AlterTable
ALTER TABLE "ProviderEarnings" ALTER COLUMN "currency" SET DEFAULT 'lkr';

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "combinedEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "descriptionEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "tagsEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "titleEmbedding" SET DATA TYPE vector(768);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "categoryId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "locationLastUpdated" TIMESTAMP(3),
    "titleEmbedding" vector(768),
    "descriptionEmbedding" vector(768),
    "combinedEmbedding" vector(768),
    "embeddingUpdatedAt" TIMESTAMP(3),
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceRequest_userId_idx" ON "ServiceRequest"("userId");

-- CreateIndex
CREATE INDEX "ServiceRequest_categoryId_idx" ON "ServiceRequest"("categoryId");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");

-- CreateIndex
CREATE INDEX "ServiceRequest_createdAt_idx" ON "ServiceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
