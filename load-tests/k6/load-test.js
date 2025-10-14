import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiTrend = new Trend('api_duration');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Test configuration
export const options = {
  // Load testing stages
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 50 },    // Stay at 50 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  
  // Thresholds - define success criteria
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],  // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.01'],  // Error rate should be less than 1%
    'errors': ['rate<0.01'],
    'http_req_duration{group:::Health Check}': ['p(95)<100'],
    'http_req_duration{group:::Categories API}': ['p(95)<300'],
    'http_req_duration{group:::Services API}': ['p(95)<500'],
  },
  
  // Test settings
  noConnectionReuse: false,
  userAgent: 'K6LoadTest/1.0',
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Helper function to make requests
function makeRequest(method, endpoint, body = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    timeout: '10s',
  };

  let response;
  if (method === 'GET') {
    response = http.get(url, params);
  } else if (method === 'POST') {
    response = http.post(url, JSON.stringify(body), params);
  } else if (method === 'PUT') {
    response = http.put(url, JSON.stringify(body), params);
  } else if (method === 'DELETE') {
    response = http.del(url, body ? JSON.stringify(body) : null, params);
  }

  // Track metrics
  const success = check(response, {
    'status is 200-299': (r) => r.status >= 200 && r.status < 300,
  });

  errorRate.add(!success);
  apiTrend.add(response.timings.duration);
  
  if (success) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    console.error(`Request failed: ${method} ${endpoint} - Status: ${response.status}`);
  }

  return response;
}

export default function () {
  // Health Check
  group('Health Check', () => {
    const response = makeRequest('GET', '/api/health');
    check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check has status field': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.hasOwnProperty('status');
        } catch (e) {
          return false;
        }
      },
    });
  });

  sleep(1);

  // Categories API
  group('Categories API', () => {
    const response = makeRequest('GET', '/api/categories');
    check(response, {
      'categories status is 200': (r) => r.status === 200,
      'categories returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch (e) {
          return false;
        }
      },
    });
  });

  sleep(1);

  // Services API
  group('Services API', () => {
    const response = makeRequest('GET', '/api/services');
    check(response, {
      'services status is 200': (r) => r.status === 200,
      'services returns data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body !== null;
        } catch (e) {
          return false;
        }
      },
    });
    
    // Try to get service details if services exist
    try {
      const services = JSON.parse(response.body);
      if (Array.isArray(services) && services.length > 0) {
        const serviceId = services[0].id;
        const detailResponse = makeRequest('GET', `/api/services/${serviceId}`);
        check(detailResponse, {
          'service detail status is 200': (r) => r.status === 200,
        });
      }
    } catch (e) {
      // Ignore parsing errors
    }
  });

  sleep(1);

  // Providers API
  group('Providers API', () => {
    // Get services first to extract a provider ID
    const servicesResponse = makeRequest('GET', '/api/services');
    let providerId = null;
    
    try {
      const services = JSON.parse(servicesResponse.body);
      if (Array.isArray(services) && services.length > 0 && services[0].providerId) {
        providerId = services[0].providerId;
        
        // Now get the provider details using the ID
        const providerResponse = makeRequest('GET', `/api/providers/${providerId}`);
        check(providerResponse, {
          'provider details status is 200': (r) => r.status === 200,
        });
      } else {
        console.log('No provider ID found in services');
      }
    } catch (e) {
      console.error('Error parsing services response', e);
    }
  });

  sleep(1);

  // Reviews API
  group('Reviews API', () => {
    // Get a user's received reviews
    const reviewsResponse = makeRequest('GET', '/api/reviews/user/1/received');
    check(reviewsResponse, {
      'user reviews status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    
    // Get service reviews for a specific service
    const serviceReviewsResponse = makeRequest('GET', '/api/service-reviews/service/1/detailed');
    check(serviceReviewsResponse, {
      'service reviews status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
  });

  sleep(2);
}

// Setup function - runs once before the test
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  
  // Test that the API is reachable using the categories endpoint
  const healthCheck = http.get(`${BASE_URL}/api/categories`);
  if (healthCheck.status !== 200) {
    throw new Error(`API is not reachable. Status: ${healthCheck.status}`);
  }
  
  return { startTime: new Date().toISOString() };
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log(`Load test completed. Started at: ${data.startTime}`);
}
