/*
  Warnings:

  - You are about to alter the column `combinedEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector")`.
  - You are about to alter the column `descriptionEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector")`.
  - You are about to alter the column `tagsEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector")`.
  - You are about to alter the column `titleEmbedding` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector")`.

*/
-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "combinedEmbedding" SET DATA TYPE vector,
ALTER COLUMN "descriptionEmbedding" SET DATA TYPE vector,
ALTER COLUMN "tagsEmbedding" SET DATA TYPE vector,
ALTER COLUMN "titleEmbedding" SET DATA TYPE vector;
