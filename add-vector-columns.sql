-- Enable pgvector extension (safe - does nothing if already exists)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector embedding columns to Service table (safe - only adds if missing)
ALTER TABLE "Service" 
ADD COLUMN IF NOT EXISTS "titleEmbedding" vector(768),
ADD COLUMN IF NOT EXISTS "descriptionEmbedding" vector(768),
ADD COLUMN IF NOT EXISTS "tagsEmbedding" vector(768),
ADD COLUMN IF NOT EXISTS "combinedEmbedding" vector(768),
ADD COLUMN IF NOT EXISTS "embeddingUpdatedAt" TIMESTAMP(3);

-- Create index for vector similarity search (safe - only creates if missing)
CREATE INDEX IF NOT EXISTS "Service_combinedEmbedding_idx" 
ON "Service" USING ivfflat ("combinedEmbedding" vector_cosine_ops) 
WITH (lists = 100);

-- Alternative: Simple index for smaller datasets
-- CREATE INDEX IF NOT EXISTS "Service_combinedEmbedding_simple_idx" 
-- ON "Service" ("combinedEmbedding");
