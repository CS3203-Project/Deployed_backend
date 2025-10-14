/*
  Warnings:

  - You are about to alter the column `combinedEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector")`.
  - You are about to alter the column `descriptionEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector")`.
  - You are about to alter the column `tagsEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector")`.
  - You are about to alter the column `titleEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector")`.
  - You are about to alter the column `titleEmbedding` on the `ServiceRequest` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to alter the column `descriptionEmbedding` on the `ServiceRequest` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to alter the column `combinedEmbedding` on the `ServiceRequest` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.

*/
-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "combinedEmbedding" SET DATA TYPE vector,
ALTER COLUMN "descriptionEmbedding" SET DATA TYPE vector,
ALTER COLUMN "tagsEmbedding" SET DATA TYPE vector,
ALTER COLUMN "titleEmbedding" SET DATA TYPE vector;

-- AlterTable
ALTER TABLE "ServiceRequest" ALTER COLUMN "titleEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "descriptionEmbedding" SET DATA TYPE vector(768),
ALTER COLUMN "combinedEmbedding" SET DATA TYPE vector(768);
