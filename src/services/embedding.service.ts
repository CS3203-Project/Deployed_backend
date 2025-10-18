export interface GeminiEmbeddingResponse {
  embedding: {
    values: number[];
  };
}

export class EmbeddingService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private dailyRequestCount: number = 0;
  private lastResetTime: number = Date.now();

  constructor() {
    // Use Gemini API for embeddings
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.apiUrl = process.env.EMBEDDING_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-004'; // Gemini text embedding model
  }

  /**
   * Rate limiting for free tier: 15 RPM, 1500/day
   */
  private async rateLimitCheck(): Promise<void> {
    const now = Date.now();
    
    // Reset daily counter if it's a new day
    if (now - this.lastResetTime > 24 * 60 * 60 * 1000) {
      this.dailyRequestCount = 0;
      this.lastResetTime = now;
    }
    
    // Check daily limit (free tier: 1500/day)
    if (this.dailyRequestCount >= 1500) {
      throw new Error('Daily API limit reached (1500 requests). Try again tomorrow.');
    }
    
    // Check rate limit (free tier: 15 RPM)
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minTimeBetweenRequests = 60 * 1000 / 15; // 4 seconds between requests
    
    if (timeSinceLastRequest < minTimeBetweenRequests) {
      const waitTime = minTimeBetweenRequests - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${Math.ceil(waitTime/1000)}s before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
    this.dailyRequestCount++;
  }

  /**
   * Generate embeddings for text input
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Clean and prepare text
      const cleanText = this.cleanText(text);
      
      if (!cleanText) {
        console.warn('Empty text provided for embedding generation');
        return new Array(768).fill(0); // Return zero vector for empty text (Gemini uses 768 dimensions)
      }

      if (this.apiKey) {
        await this.rateLimitCheck(); // Add rate limiting
        return await this.generateGeminiEmbedding(cleanText);
      } else {
        console.warn('No embedding API configured, using fallback');
        return await this.generateFallbackEmbedding(cleanText);
      }
    } catch (error) {
      console.error('Error generating embedding:', error);
      
      // If rate limit hit, use fallback
      if (error instanceof Error && error.message.includes('Daily API limit reached')) {
        console.warn('🚫 API limit reached, using fallback embedding');
        return await this.generateFallbackEmbedding(this.cleanText(text));
      }
      
      return new Array(768).fill(0); // Return zero vector on error
    }
  }

  /**
   * Generate embeddings for service data (title + description + tags)
   */
  async generateServiceEmbeddings(service: {
    title?: string;
    description?: string;
    tags?: string[];
  }) {
    const title = service.title || '';
    const description = service.description || '';
    const tags = service.tags?.join(', ') || '';

    // Combine all text for comprehensive embedding
    const combinedText = [title, description, tags]
      .filter(Boolean)
      .join('. ');

    const [titleEmbedding, descriptionEmbedding, tagsEmbedding, combinedEmbedding] = await Promise.all([
      this.generateEmbedding(title),
      this.generateEmbedding(description),
      this.generateEmbedding(tags),
      this.generateEmbedding(combinedText)
    ]);

    return {
      titleEmbedding,
      descriptionEmbedding,
      tagsEmbedding,
      combinedEmbedding
    };
  }

  /**
   * Generate embedding using Gemini API
   */
  private async generateGeminiEmbedding(text: string): Promise<number[]> {
    const url = `${this.apiUrl}/${this.model}:embedContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: `models/${this.model}`,
        content: {
          parts: [{
            text: text
          }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GeminiEmbeddingResponse;

    if (data.embedding && data.embedding.values) {
      return data.embedding.values;
    }

    throw new Error('Invalid embedding response from Gemini');
  }

  /**
   * Simple fallback embedding for development/testing
   * Uses basic text hashing - not suitable for production
   */
  private async generateFallbackEmbedding(text: string): Promise<number[]> {
    console.warn('Using fallback embedding generation - not suitable for production');
    
    // Simple hash-based embedding (for development only)
    const embedding = new Array(768).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const position = hash % 768;
      embedding[position] += 1;
    });

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  /**
   * Clean text for embedding generation
   */
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.-]/g, '') // Remove special characters except periods and hyphens
      .substring(0, 8000); // Limit text length
  }

  /**
   * Simple hash function for fallback embedding
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}

export const embeddingService = new EmbeddingService();
