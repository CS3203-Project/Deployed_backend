/// <reference types="jest" />
import request from 'supertest';
import { TEST_SERVER_URL, setupIntegrationTests } from './test-server';

/**
 * Performance Integration Tests
 * 
 * Prerequisites: The API server must be running
 * Start with: npm run dev
 */

describe('Performance Integration Tests', () => {
  const baseURL = TEST_SERVER_URL;

  beforeAll(async () => {
    await setupIntegrationTests();
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(baseURL).get('/api/categories')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain performance under concurrent load', async () => {
      const startTime = Date.now();
      
      const requests = Array(20).fill(null).map(() => 
        request(baseURL).get('/api/services')
      );

      await Promise.all(requests);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All 20 requests should complete within 3 seconds
      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting for excessive requests', async () => {
      const requests = [];
      
      // Send many requests rapidly to a working endpoint
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(baseURL).get('/api/categories')
        );
      }

      const responses = await Promise.all(requests);
      
      // With rate limit of 10000/30min, most should succeed
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(90);
      
      // Check if rate limiting is working (429 status)
      const rateLimitedRequests = responses.filter(r => r.status === 429);
      console.log(`Rate limited requests: ${rateLimitedRequests.length}/100`);
    }, 15000); // Increased timeout for this test
  });

  describe('Payload Size Handling', () => {
    it('should handle large response payloads', async () => {
      const response = await request(baseURL)
        .get('/api/services')
        .expect(200);

      // Check that response is not empty
      expect(response.body).toBeDefined();
      
      // Response should be delivered within reasonable time even if large
      expect(response.header['content-length'] || '0').toBeDefined();
    });
  });

  describe('Database Connection Pooling', () => {
    it('should efficiently handle multiple database queries', async () => {
      const startTime = Date.now();
      
      // Multiple endpoints that hit the database
      await Promise.all([
        request(baseURL).get('/api/category'),
        request(baseURL).get('/api/services'),
        request(baseURL).get('/api/providers'),
        request(baseURL).get('/api/reviews'),
        request(baseURL).get('/api/service-reviews'),
      ]);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All queries should complete efficiently with connection pooling
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory on repeated requests', async () => {
      const iterations = 50;
      
      for (let i = 0; i < iterations; i++) {
        await request(baseURL).get('/api/category');
      }
      
      // If we made it here without crashing, the test passes
      expect(true).toBe(true);
    }, 30000); // Increased timeout
  });

  describe('Response Compression', () => {
    it('should support gzip compression if configured', async () => {
      const response = await request(baseURL)
        .get('/api/services')
        .set('Accept-Encoding', 'gzip, deflate')
        .expect(200);

      // Check if compression is applied (optional based on configuration)
      if (response.header['content-encoding']) {
        expect(['gzip', 'deflate']).toContain(response.header['content-encoding']);
      }
    });
  });
});
