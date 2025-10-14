/*
  Warnings:

  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `combinedEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to alter the column `descriptionEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to alter the column `tagsEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to alter the column `titleEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "platformFee" DECIMAL(10,2),
ADD COLUMN     "providerAmount" DECIMAL(10,2),
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "gateway" SET DEFAULT 'stripe',
ALTER COLUMN "chargeId" DROP NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'usd',
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "combinedEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "descriptionEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "tagsEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "titleEmbedding" SET DATA TYPE vector(768);

-- CreateTable
CREATE TABLE "ProviderEarnings" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "totalEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "availableBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeAccountId" TEXT,
    "lastPayoutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderEarnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderEarnings_providerId_key" ON "ProviderEarnings"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderEarnings_stripeAccountId_key" ON "ProviderEarnings"("stripeAccountId");

-- CreateIndex
CREATE INDEX "ProviderEarnings_providerId_idx" ON "ProviderEarnings"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
