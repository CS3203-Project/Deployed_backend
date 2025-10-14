/*
  Warnings:

  - You are about to alter the column `combinedEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector` to `Unsupported("vector(768)")`.
  - You are about to alter the column `descriptionEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector` to `Unsupported("vector(768)")`.
  - You are about to alter the column `tagsEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector` to `Unsupported("vector(768)")`.
  - You are about to alter the column `titleEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector` to `Unsupported("vector(768)")`.
  - You are about to drop the `ServiceRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ServiceRequest" DROP CONSTRAINT "ServiceRequest_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceRequest" DROP CONSTRAINT "ServiceRequest_userId_fkey";

-- DropIndex
DROP INDEX "public"."Category_slug_idx";

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "combinedEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "descriptionEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "tagsEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "titleEmbedding" SET DATA TYPE vector(768);

-- DropTable
DROP TABLE "public"."ServiceRequest";

-- DropEnum
DROP TYPE "public"."ServiceRequestStatus";
