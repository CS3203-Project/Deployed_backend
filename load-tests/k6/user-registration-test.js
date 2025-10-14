import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// User Registration Test
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Low rate to test registration
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.01'],    // Error rate should be less than 1%
    'errors': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  // Generate a unique email
  const randomId = Math.floor(Math.random() * 1000000);
  const email = `loadtest${randomId}@example.com`;
  
  // User Registration
  group('User Registration API', () => {
    const payload = {
      email: email,
      password: 'TestPass123!',
      firstName: 'Load',
      lastName: 'Test',
      phone: `+1${Math.floor(Math.random() * 10000000000)}`
    };

    const response = http.post(`${BASE_URL}/api/users/register`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log(`Registration status: ${response.status}, Body length: ${response.body.length}`);
    
    // Check registration response
    check(response, {
      'registration status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return typeof body.token === 'string' && body.token.length > 0;
        } catch (e) {
          console.log(`Error parsing response: ${e.message}`);
          return false;
        }
      },
    });

    if (response.status >= 400) {
      console.log(`Registration failed: ${response.body}`);
    }

    errorRate.add(response.status >= 400);
  });

  sleep(1);
}

export function setup() {
  console.log('Starting user registration test...');
}

export function teardown() {
  console.log('User registration test completed');
}