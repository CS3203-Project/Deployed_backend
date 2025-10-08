-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "combinedEmbedding" vector(768),
ADD COLUMN     "descriptionEmbedding" vector(768),
ADD COLUMN     "embeddingUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "tagsEmbedding" vector(768),
ADD COLUMN     "titleEmbedding" vector(768);

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "public"."Service"("isActive");

-- CreateIndex
CREATE INDEX "Service_categoryId_idx" ON "public"."Service"("categoryId");

-- CreateIndex
CREATE INDEX "Service_providerId_idx" ON "public"."Service"("providerId");

-- CreateIndex
CREATE INDEX "Service_createdAt_idx" ON "public"."Service"("createdAt");

-- CreateIndex
-- For pgvector we must specify an operator class for the index. Use ivfflat with vector_l2_ops
-- Adjust the index definition to include the operator class and an appropriate number of lists.
CREATE INDEX "Service_combinedEmbedding_idx" ON "public"."Service" USING ivfflat ("combinedEmbedding" vector_l2_ops) WITH (lists = 100);
