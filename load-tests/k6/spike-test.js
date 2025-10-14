import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Spike test - sudden increase in load
export const options = {
  stages: [
    { duration: '30s', target: 10 },    // Baseline
    { duration: '30s', target: 500 },   // Sudden spike!
    { duration: '1m', target: 500 },    // Maintain spike
    { duration: '30s', target: 10 },    // Quick recovery
    { duration: '30s', target: 0 },     // Ramp down
  ],
  
  thresholds: {
    'http_req_failed': ['rate<0.1'],  // Allow 10% error rate during spike
    'errors': ['rate<0.1'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  const response = http.get(`${BASE_URL}/api/categories`, {
    timeout: '15s',
  });

  const success = check(response, {
    'status is acceptable': (r) => 
      r.status === 200 || r.status === 429 || r.status === 503,
  });

  errorRate.add(!success);

  sleep(0.1);  // Very short sleep for spike testing
}

export function setup() {
  console.log('Starting spike test - sudden traffic increase');
}
