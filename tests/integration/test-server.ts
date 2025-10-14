/**
 * Pre-flight check for integration tests
 * Verifies that the server is running before tests execute
 */

import http from 'http';

export const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';

export function getTestServerUrl(): string {
  return TEST_SERVER_URL;
}

export async function checkServerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const url = new URL(TEST_SERVER_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: '/api/categories',
      method: 'GET',
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Setup function to check server availability before running tests
 */
export async function setupIntegrationTests(): Promise<void> {
  const isRunning = await checkServerRunning();
  
  if (!isRunning) {
    console.error('\n❌ ERROR: API Server is not running!\n');
    console.error('Integration tests require the API server to be running.\n');
    console.error('Please start the server in another terminal:\n');
    console.error('  cd "c:\\Users\\umesh\\OneDrive\\Desktop\\Project file\\backend"');
    console.error('  npm run dev\n');
    console.error('Then run the tests again:\n');
    console.error('  npm run test:integration\n');
    throw new Error('API Server is not running. Cannot run integration tests.');
  }
  
  console.log('✓ Server is running at', TEST_SERVER_URL);
}

/**
 * Note: Integration tests expect the server to be running.
 * Start the server before running integration tests:
 * 
 *   Terminal 1:
 *   npm run dev
 * 
 *   Terminal 2:
 *   npm run test:integration
 */
