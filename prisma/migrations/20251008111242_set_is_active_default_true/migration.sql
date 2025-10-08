/*
  Warnings:

  - You are about to alter the column `combinedEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to alter the column `descriptionEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to alter the column `tagsEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to alter the column `titleEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to drop the `email_queue` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- DropForeignKey
ALTER TABLE "public"."email_queue" DROP CONSTRAINT "email_queue_userId_fkey";

-- DropIndex
DROP INDEX "public"."Service_combinedEmbedding_idx";

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationLastUpdated" TIMESTAMP(3),
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "serviceRadiusKm" DOUBLE PRECISION DEFAULT 10,
ADD COLUMN     "state" TEXT,
ALTER COLUMN "combinedEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "descriptionEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "tagsEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "titleEmbedding" SET DATA TYPE vector(768);

-- DropTable
DROP TABLE "public"."email_queue";

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "emailType" "EmailType" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_userId_idx" ON "notification"("userId");

-- CreateIndex
CREATE INDEX "notification_emailType_idx" ON "notification"("emailType");

-- CreateIndex
CREATE INDEX "notification_sentAt_idx" ON "notification"("sentAt");

-- CreateIndex
CREATE INDEX "Service_latitude_longitude_idx" ON "Service"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Service_city_idx" ON "Service"("city");

-- CreateIndex
CREATE INDEX "Service_state_idx" ON "Service"("state");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
