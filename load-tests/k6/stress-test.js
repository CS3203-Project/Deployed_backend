import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

// Stress test configuration - gradually increase load to find breaking point
export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Warm up
    { duration: '2m', target: 100 },   // Moderate load
    { duration: '2m', target: 200 },   // Heavy load
    { duration: '2m', target: 300 },   // Very heavy load
    { duration: '2m', target: 400 },   // Extreme load
    { duration: '1m', target: 0 },     // Ramp down
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<2000'],  // More lenient for stress testing
    'http_req_failed': ['rate<0.05'],     // Allow 5% error rate
    'errors': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  // Mix of read operations to stress the system
  const endpoints = [
    '/api/categories',
    '/api/services',
    '/api/services/search',
    '/api/reviews/user/1/received',
    '/api/service-reviews/service/1/detailed',
  ];

  // Randomly select an endpoint
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  const response = http.get(`${BASE_URL}${endpoint}`, {
    timeout: '30s',
  });

  const success = check(response, {
    'status is 200 or 429 or 503': (r) => 
      r.status === 200 || r.status === 429 || r.status === 503,
  });

  errorRate.add(!success);
  apiDuration.add(response.timings.duration);

  sleep(0.5);  // Short sleep for stress testing
}

export function setup() {
  console.log('Starting stress test...');
  console.log('This test will gradually increase load to find the breaking point');
}

export function teardown() {
  console.log('Stress test completed');
}
