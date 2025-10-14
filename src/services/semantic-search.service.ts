import { prisma } from '../utils/database.js';
import { embeddingService } from './embedding.service.js';

export interface SemanticSearchOptions {
  query: string;
  limit?: number;
  threshold?: number;
  categoryId?: string;
  providerId?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface SemanticSearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
  images: string[];
  similarity: number;
  provider: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  category: {
    id: string;
    name: string;
  };
}

export class SemanticSearchService {
  /**
   * Perform semantic search for services
   */
  async searchServices(options: SemanticSearchOptions): Promise<SemanticSearchResult[]> {
    const {
      query,
      limit = 20,
      threshold = 0.3,
      categoryId,
      providerId,
      isActive = true,
      minPrice,
      maxPrice
    } = options;

    try {
      // Generate embedding for search query
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      // Convert embedding to PostgreSQL array format
      const embeddingVector = `[${queryEmbedding.join(',')}]`;

      // Build WHERE conditions
      const whereConditions = ['s."isActive" = $1'];
      const params: any[] = [isActive];
      let paramIndex = 2;

      if (categoryId) {
        whereConditions.push(`s."categoryId" = $${paramIndex}`);
        params.push(categoryId);
        paramIndex++;
      }

      if (providerId) {
        whereConditions.push(`s."providerId" = $${paramIndex}`);
        params.push(providerId);
        paramIndex++;
      }

      if (minPrice !== undefined) {
        whereConditions.push(`s.price >= $${paramIndex}`);
        params.push(minPrice);
        paramIndex++;
      }

      if (maxPrice !== undefined) {
        whereConditions.push(`s.price <= $${paramIndex}`);
        params.push(maxPrice);
        paramIndex++;
      }

      // Add similarity threshold
      whereConditions.push(`(1 - (s."combinedEmbedding" <=> $${paramIndex}::vector)) >= $${paramIndex + 1}`);
      params.push(embeddingVector, threshold);
      paramIndex += 2;

      const whereClause = whereConditions.join(' AND ');

      // Raw SQL query for vector similarity search
      const query_sql = `
        SELECT 
          s.id,
          s.title,
          s.description,
          s.price,
          s.currency,
          s.tags,
          s.images,
          s."createdAt",
          (1 - (s."combinedEmbedding" <=> $${paramIndex}::vector)) as similarity,
          p.id as provider_id,
          u."firstName" as provider_first_name,
          u."lastName" as provider_last_name,
          c.id as category_id,
          c.name as category_name
        FROM "Service" s
        INNER JOIN "ServiceProvider" p ON s."providerId" = p.id
        INNER JOIN "User" u ON p."userId" = u.id
        INNER JOIN "Category" c ON s."categoryId" = c.id
        WHERE ${whereClause}
          AND s."combinedEmbedding" IS NOT NULL
        ORDER BY similarity DESC
        LIMIT $${paramIndex + 1}
      `;

      params.push(embeddingVector, limit);

      const results = await prisma.$queryRawUnsafe(query_sql, ...params) as any[];

      return results.map(row => ({
        id: row.id,
        title: row.title || '',
        description: row.description || '',
        price: parseFloat(row.price),
        currency: row.currency,
        tags: row.tags || [],
        images: row.images || [],
        similarity: parseFloat(row.similarity),
        provider: {
          id: row.provider_id,
          user: {
            firstName: row.provider_first_name || '',
            lastName: row.provider_last_name || ''
          }
        },
        category: {
          id: row.category_id,
          name: row.category_name || ''
        }
      }));

    } catch (error) {
      console.error('Semantic search error:', error);
      throw new Error('Failed to perform semantic search');
    }
  }

  /**
   * Update embeddings for a service
   */
  async updateServiceEmbeddings(serviceId: string) {
    try {
      // Get service data
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: {
          id: true,
          title: true,
          description: true,
          tags: true
        }
      });

      if (!service) {
        throw new Error(`Service with ID ${serviceId} not found`);
      }

      // Generate embeddings
      const embeddings = await embeddingService.generateServiceEmbeddings({
        title: service.title ?? '',
        description: service.description ?? '',
        tags: service.tags
      });

      // Update service with embeddings using raw query
      await prisma.$executeRaw`
        UPDATE "Service" 
        SET 
          "titleEmbedding" = ${`[${embeddings.titleEmbedding.join(',')}]`}::vector,
          "descriptionEmbedding" = ${`[${embeddings.descriptionEmbedding.join(',')}]`}::vector,
          "tagsEmbedding" = ${`[${embeddings.tagsEmbedding.join(',')}]`}::vector,
          "combinedEmbedding" = ${`[${embeddings.combinedEmbedding.join(',')}]`}::vector,
          "embeddingUpdatedAt" = NOW()
        WHERE id = ${serviceId}
      `;

      console.log(`✅ Updated embeddings for service ${serviceId}`);

    } catch (error) {
      console.error(`❌ Failed to update embeddings for service ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Batch update embeddings for all services that don't have them
   */
  async updateAllServiceEmbeddings(batchSize: number = 5) { // Reduced batch size for free tier
    try {
      console.log('🚀 Starting batch embedding update...');

      // Get services without embeddings (smaller batches for free tier)
      const services = await prisma.$queryRawUnsafe(`
        SELECT id, title, description, tags 
        FROM "Service" 
        WHERE "combinedEmbedding" IS NULL 
        AND "isActive" = true 
        LIMIT $1
      `, batchSize) as any[];

      console.log(`📝 Found ${services.length} services to update`);

      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        try {
          console.log(`⏳ Processing service ${i + 1}/${services.length}: ${service.title}`);
          await this.updateServiceEmbeddings(service.id);
          
          // Add delay between requests for free tier (4+ seconds)
          if (i < services.length - 1) {
            console.log('⏱️ Waiting 5s before next request (rate limit)...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } catch (error) {
          console.error(`Failed to update embeddings for service ${service.id}:`, error);
          // Continue with next service
        }
      }

      console.log('✅ Batch embedding update completed');
      return services.length;

    } catch (error) {
      console.error('❌ Batch embedding update failed:', error);
      throw error;
    }
  }

  /**
   * Find similar services to a given service
   */
  async findSimilarServices(serviceId: string, limit: number = 5): Promise<SemanticSearchResult[]> {
    try {
      console.log('🔍 Finding similar services for:', serviceId);
      
      // Use raw query to get embedding (cast to text to avoid deserialization issues)
      const serviceResult = await prisma.$queryRawUnsafe(`
        SELECT "combinedEmbedding"::text as embedding_text
        FROM "Service" 
        WHERE id = $1 AND "combinedEmbedding" IS NOT NULL
      `, serviceId) as any[];

      console.log('📊 Service query result:', serviceResult?.length ? 'Found embedding' : 'No embedding found');
      
      if (!serviceResult || serviceResult.length === 0) {
        throw new Error('Service embedding not found');
      }

      const serviceEmbedding = serviceResult[0].embedding_text;
      console.log('✅ Got service embedding as text, length:', serviceEmbedding?.length || 0);

      const query_sql = `
        SELECT 
          s.id,
          s.title,
          s.description,
          s.price,
          s.currency,
          s.tags,
          s.images,
          (1 - (s."combinedEmbedding" <=> ($1::text)::vector)) as similarity,
          p.id as provider_id,
          u."firstName" as provider_first_name,
          u."lastName" as provider_last_name,
          c.id as category_id,
          c.name as category_name
        FROM "Service" s
        INNER JOIN "ServiceProvider" p ON s."providerId" = p.id
        INNER JOIN "User" u ON p."userId" = u.id
        INNER JOIN "Category" c ON s."categoryId" = c.id
        WHERE s.id != $2 
          AND s."isActive" = true
          AND s."combinedEmbedding" IS NOT NULL
        ORDER BY similarity DESC
        LIMIT $3
      `;

      console.log('🔍 Executing similarity query with params:', { serviceId, limit });
      const results = await prisma.$queryRawUnsafe(query_sql, serviceEmbedding, serviceId, limit) as any[];
      console.log('📊 Query results count:', results?.length || 0);

      return results.map(row => ({
        id: row.id,
        title: row.title || '',
        description: row.description || '',
        price: parseFloat(row.price),
        currency: row.currency,
        tags: row.tags || [],
        images: row.images || [],
        similarity: parseFloat(row.similarity),
        provider: {
          id: row.provider_id,
          user: {
            firstName: row.provider_first_name || '',
            lastName: row.provider_last_name || ''
          }
        },
        category: {
          id: row.category_id,
          name: row.category_name || ''
        }
      }));

    } catch (error) {
      console.error('❌ Error finding similar services:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      } else {
        console.error('Error details:', error);
      }
      throw new Error('Failed to find similar services');
    }
  }
}

export const semanticSearchService = new SemanticSearchService();