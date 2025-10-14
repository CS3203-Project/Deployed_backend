import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Soak test - sustained load over extended period
export const options = {
  stages: [
    { duration: '2m', target: 50 },     // Ramp up
    { duration: '30m', target: 50 },    // Sustained load for 30 minutes
    { duration: '2m', target: 0 },      // Ramp down
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
    'errors': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  // Simulate realistic user behavior
  const response1 = http.get(`${BASE_URL}/api/categories`);
  check(response1, { 'categories OK': (r) => r.status === 200 });
  sleep(2);

  const response2 = http.get(`${BASE_URL}/api/services`);
  check(response2, { 'services OK': (r) => r.status === 200 });
  sleep(3);

  const response3 = http.get(`${BASE_URL}/api/providers`);
  check(response3, { 'providers OK': (r) => r.status === 200 });
  sleep(2);

  errorRate.add(
    response1.status !== 200 || 
    response2.status !== 200 || 
    response3.status !== 200
  );
}

export function setup() {
  console.log('Starting soak test - 30 minute sustained load');
  console.log('This test helps identify memory leaks and performance degradation');
}
