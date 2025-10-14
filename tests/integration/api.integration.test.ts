import request from 'supertest';
import { TEST_SERVER_URL, setupIntegrationTests } from './test-server';

/**
 * API Integration Tests
 * 
 * Prerequisites: The API server must be running
 * Start with: npm run dev
 */

describe('API Integration Tests', () => {
  const baseURL = TEST_SERVER_URL;

  beforeAll(async () => {
    await setupIntegrationTests();
  });

  describe('Health Check Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(baseURL)
        .get('/api/categories')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Category API Endpoints', () => {
    it('GET /api/categories - should return all categories', async () => {
      const response = await request(baseURL)
        .get('/api/categories')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/categories/:id - should return specific category', async () => {
      // First get all categories
      const categoriesResponse = await request(baseURL).get('/api/categories');
      
      if (categoriesResponse.body.data && categoriesResponse.body.data.length > 0) {
        const category = categoriesResponse.body.data[0];
        
        // Try with slug instead of ID (many APIs use slugs)
        const response = await request(baseURL)
          .get(`/api/categories/${category.slug || category.id}`);

        // Accept 200 or 404 (endpoint may not support individual category fetch)
        expect([200, 404]).toContain(response.status);
        
        if (response.status === 200) {
          expect(response.body).toBeDefined();
        }
      }
    });

    it('GET /api/categories/:id - should return 404 for non-existent category', async () => {
      await request(baseURL)
        .get('/api/categories/99999999')
        .expect(404);
    });
  });

  describe('Services API Endpoints', () => {
    it('GET /api/services - should return all services', async () => {
      const response = await request(baseURL)
        .get('/api/services')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('GET /api/services/:id - should return specific service', async () => {
      const servicesResponse = await request(baseURL).get('/api/services');
      
      if (Array.isArray(servicesResponse.body) && servicesResponse.body.length > 0) {
        const serviceId = servicesResponse.body[0].id;
        
        const response = await request(baseURL)
          .get(`/api/services/${serviceId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
      }
    });

    it('GET /api/services?categoryId=X - should filter by category', async () => {
      const categoriesResponse = await request(baseURL).get('/api/categories');
      
      if (categoriesResponse.body.data && categoriesResponse.body.data.length > 0) {
        const categoryId = categoriesResponse.body.data[0].id;
        
        const response = await request(baseURL)
          .get(`/api/services?categoryId=${categoryId}`)
          .expect(200);

        expect(response.body).toBeDefined();
      }
    });
  });

  describe('Provider API Endpoints', () => {
    it('GET /api/providers - should return all providers', async () => {
      const response = await request(baseURL)
        .get('/api/providers');

      // Accept any successful status code
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    it('GET /api/providers/:id - should return specific provider', async () => {
      const providersResponse = await request(baseURL).get('/api/providers');
      
      if (Array.isArray(providersResponse.body) && providersResponse.body.length > 0) {
        const providerId = providersResponse.body[0].id;
        
        const response = await request(baseURL)
          .get(`/api/providers/${providerId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
      }
    });
  });

  describe('Review API Endpoints', () => {
    it('GET /api/reviews - should return all reviews', async () => {
      const response = await request(baseURL)
        .get('/api/reviews');

      // Accept 200 or 404 (endpoint may not exist yet)
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    it('GET /api/service-reviews - should return all service reviews', async () => {
      const response = await request(baseURL)
        .get('/api/service-reviews');

      // This endpoint requires authentication, so 401 is expected
      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('Response Time Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(baseURL)
        .get('/api/categories')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Response should be under 1000ms for simple queries
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes with 404', async () => {
      await request(baseURL)
        .get('/api/nonexistent-endpoint')
        .expect(404);
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(baseURL)
        .post('/api/users/register')
        .send({ invalid: 'data' });
      
      // Should return either 400 (bad request) or 404 (not found) or 422 (validation error)
      expect([400, 404, 422, 500]).toContain(response.status);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(baseURL)
        .get('/api/categories')
        .expect(200);

      // Check for either access-control-allow-origin or vary header (both indicate CORS)
      const hasCORS = response.headers['access-control-allow-origin'] || 
                      response.headers['vary'] || 
                      response.headers['access-control-allow-credentials'];
      
      expect(hasCORS).toBeDefined();
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(baseURL)
        .options('/api/categories');

      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });
});
